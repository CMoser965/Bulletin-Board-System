// main.rs

mod models;
mod server;
mod websocket;

use std::env;
use std::sync::{Arc, Mutex};
use tokio::net::TcpListener;
use tokio::io::AsyncReadExt;
use server::Server;
use models::ArticleList;

#[tokio::main]
async fn main() {
    // Parse the port from command-line arguments
    let args: Vec<String> = env::args().collect();
    let port = args.get(1).expect("Usage: cargo run <port>").parse::<u16>().expect("Invalid port");

    // Define peer addresses based on the server's port
    let peers = match port {
        8080 => vec!["127.0.0.1:9081".to_string(), "127.0.0.1:9082".to_string()],
        8081 => vec!["127.0.0.1:9080".to_string(), "127.0.0.1:9082".to_string()],
        8082 => vec!["127.0.0.1:9080".to_string(), "127.0.0.1:9081".to_string()],
        _ => panic!("Unknown port"),
    };

    let articles = Arc::new(Mutex::new(ArticleList { articles: Vec::new() }));
    let quorum_size = 2;
    let server = Server::new(articles.clone(), quorum_size, peers);

    // Start WebSocket listener for client connections
    let ws_listener = TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .expect("Failed to bind WebSocket listener");
    println!("WebSocket server started on port {}", port);

    tokio::spawn({
        let server = server.clone();
        async move {
            while let Ok((stream, _)) = ws_listener.accept().await {
                let server = server.clone();
                tokio::spawn(async move {
                    server.handle_connection(stream).await;
                });
            }
        }
    });

    // Start TCP listener for peer connections on a separate port (port + 1000)
    let peer_listener = TcpListener::bind(format!("0.0.0.0:{}", port + 1000))
        .await
        .expect("Failed to bind peer listener");
    println!("Peer listener started on port {}", port + 1000);

    while let Ok((mut peer_stream, _)) = peer_listener.accept().await {
        let server = server.clone();
        tokio::spawn(async move {
            let mut buffer = vec![0; 1024];
            if let Ok(size) = peer_stream.read(&mut buffer).await {
                let message = String::from_utf8_lossy(&buffer[..size]);
                println!("Received message from peer: {}", message);
                // Process received peer message if necessary
            } else {
                println!("Failed to read from peer");
            }
        });
    }
}
