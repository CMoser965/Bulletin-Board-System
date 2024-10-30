// test_client.rs

use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::connect_async;
use tungstenite::protocol::Message;

#[tokio::main]
async fn main() {
    // Connect to the WebSocket server
    let server_url = "ws://127.0.0.1:8080"; // Adjust as needed to test different servers
    let (ws_stream, _) = connect_async(server_url)
        .await
        .expect("Failed to connect to server");

    let (mut write, mut read) = ws_stream.split();

    // Send a plain text POST request
    let post_article = "POST Test Article";

    write.send(Message::Text(post_article.to_string()))
        .await
        .expect("Failed to send POST request");

    // Check for a response from the server
    let mut quorum_achieved = false;

    while let Some(msg) = read.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                if text.contains("Success") {
                    quorum_achieved = true;
                    println!("Quorum achieved: {}", text);
                    break;
                } else {
                    println!("Server response: {}", text);
                }
            }
            Ok(Message::Close(_)) => {
                println!("Server closed the connection.");
                break;
            }
            Err(e) => {
                println!("Error reading message: {:?}", e);
                break;
            }
            _ => (),
        }
    }

    if !quorum_achieved {
        println!("Quorum not achieved");
    }
}
