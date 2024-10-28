mod models;

use models::{Article, ArticleList};
use std::sync::{Arc, Mutex};
use tokio::net::TcpListener;
use tokio_tungstenite::tungstenite::protocol::Message;
use tokio_tungstenite::accept_async;
use futures_util::{StreamExt, SinkExt};
use uuid::Uuid;

#[tokio::main]
async fn main() {
    let articles = Arc::new(Mutex::new(ArticleList { articles: Vec::new() }));
    let listener = TcpListener::bind("0.0.0.0:8080").await.expect("Failed to bind to port 8080");
    
    println!("WebSocket server started, listening on port 8080...");

    while let Ok((stream, _)) = listener.accept().await {
        let articles = Arc::clone(&articles);

        tokio::spawn(async move {
            let ws_stream = accept_async(stream).await.expect("Error during WebSocket handshake");

            println!("New WebSocket client connected!");

            let (mut write, mut read) = ws_stream.split();

            while let Some(msg) = read.next().await {
                match msg {
                    Ok(Message::Text(text)) => {
                        println!("Received request: {}", text);

                        // Check if the text starts with POST and parse content and parent_id
                        let response = if text.starts_with("POST") {
                            let content = text.trim_start_matches("POST ").to_string();

                            // Detect if the content includes "Reply to <parent_id>: <content>"
                            let (content, parent_id) = if content.starts_with("Reply to ") {
                                // Parse the "Reply to <parent_id>: <content>" format
                                let parts: Vec<&str> = content.splitn(2, ": ").collect();
                                let parent_id_part = parts[0].replace("Reply to ", "");
                                let reply_content = parts.get(1).map(|s| s.to_string()).unwrap_or_default();

                                // Parse parent_id as Uuid, if it fails, set it to None
                                let parent_id = Uuid::parse_str(&parent_id_part).ok();
                                (reply_content, parent_id)
                            } else {
                                (content, None) // No parent_id means it's a new post
                            };

                            let new_article = Article {
                                id: Uuid::new_v4(),
                                title: format!("Article {}", articles.lock().unwrap().articles.len() + 1),
                                content,
                                parent_id,
                            };
                            articles.lock().unwrap().articles.push(new_article.clone());
                            serde_json::to_string(&new_article).unwrap()
                        } else if text.starts_with("READ") {
                            let article_list = articles.lock().unwrap().articles.clone();
                            serde_json::to_string(&article_list).unwrap()
                        } else {
                            "Unknown command".to_string()
                        };

                        println!("Sending response: {}", response);
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
        });
    }
}
