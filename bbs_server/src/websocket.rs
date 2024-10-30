// src/websocket.rs

use crate::models::{ServerResponse, Article};
use crate::server::Server;
use futures_util::{StreamExt, SinkExt};
use tokio::net::TcpStream;
use tokio_tungstenite::{accept_async, tungstenite::protocol::Message};
use uuid::Uuid;

pub async fn handle_websocket(stream: TcpStream, server: Server) {
    let ws_stream = accept_async(stream).await.expect("Error during WebSocket handshake");
    println!("New WebSocket client connected!");

    let (mut write, mut read) = ws_stream.split();

    while let Some(msg) = read.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                println!("Received request: {}", text);

                let response = if text.starts_with("POST") {
                    // Parse post content and parent_id for replies
                    let content = text.trim_start_matches("POST ").to_string();
                    let (content, parent_id) = if content.starts_with("Reply to ") {
                        let parts: Vec<&str> = content.splitn(2, ": ").collect();
                        let parent_id_part = parts[0].replace("Reply to ", "");
                        let reply_content = parts.get(1).map(|s| s.to_string()).unwrap_or_default();
                        let parent_id = Uuid::parse_str(&parent_id_part).ok();
                        (reply_content, parent_id)
                    } else {
                        (content, None)
                    };

                    // Call server's quorum-based post handler
                    match server.handle_post(content, parent_id).await {
                        ServerResponse::Success(article) => serde_json::to_string(&article).unwrap(),
                        ServerResponse::Failure(message) => message,
                        _ => "Unexpected response".to_string(),
                    }
                } else if text.starts_with("READ") {
                    // Handle reading all articles
                    match server.handle_read() {
                        ServerResponse::ArticleList(articles) => serde_json::to_string(&articles).unwrap(),
                        _ => "Error reading articles".to_string(),
                    }
                } else {
                    "Unknown command".to_string()
                };

                // Send response back to client
                if let Err(e) = write.send(Message::Text(response)).await {
                    println!("Failed to send response: {}", e);
                }
            }
            Ok(Message::Close(_)) => {
                println!("Client disconnected.");
                break;
            }
            Err(e) => {
                println!("Error processing message: {}", e);
                break;
            }
            _ => (),
        }
    }
}
