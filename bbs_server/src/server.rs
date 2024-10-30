// server.rs

use crate::models::{Article, ArticleList, ServerResponse};
use crate::websocket::handle_websocket;
use std::sync::{Arc, Mutex};
use tokio::net::TcpStream;
use tokio::sync::mpsc;
use uuid::Uuid;
use tokio::io::AsyncWriteExt;

#[derive(Clone)]
pub struct Server {
    articles: Arc<Mutex<ArticleList>>,
    quorum_size: usize,
    peers: Vec<String>, // Addresses of peer servers
}

impl Server {
    pub fn new(articles: Arc<Mutex<ArticleList>>, quorum_size: usize, peers: Vec<String>) -> Self {
        Server {
            articles,
            quorum_size,
            peers,
        }
    }

    /// Handle WebSocket client connections only
    pub async fn handle_connection(&self, stream: TcpStream) {
        handle_websocket(stream, self.clone()).await;
    }

    /// Send POST request to peers and check quorum
    pub async fn handle_post(&self, content: String, parent_id: Option<Uuid>) -> ServerResponse {
        let new_article = Article {
            id: Uuid::new_v4(),
            title: format!("Article {}", self.articles.lock().unwrap().articles.len() + 1),
            content: content.clone(),
            parent_id,
        };

        let mut confirmations = 0;
        let (tx, mut rx) = mpsc::channel(self.peers.len());

        for peer in &self.peers {
            let tx = tx.clone();
            let peer = peer.clone();
            let article_clone = new_article.clone();
            tokio::spawn(async move {
                let confirmed = Self::send_to_peer(&peer, &article_clone).await;
                let _ = tx.send(confirmed).await;
            });
        }

        while let Some(confirmed) = rx.recv().await {
            if confirmed {
                confirmations += 1;
            }
            if confirmations >= self.quorum_size {
                // Quorum achieved; log it and respond to the client
                self.articles.lock().unwrap().articles.push(new_article.clone());
                println!("Quorum achieved for article {}", new_article.id);
                return ServerResponse::Success(new_article);
            }
        }

        ServerResponse::Failure("Failed to reach quorum".to_string())
    }

    pub fn handle_read(&self) -> ServerResponse {
        let articles = self.articles.lock().unwrap().articles.clone();
        ServerResponse::ArticleList(articles)
    }

    /// Send an article to a peer over plain TCP (not WebSocket)
    async fn send_to_peer(peer_address: &str, article: &Article) -> bool {
        println!("Attempting to connect to peer at {}", peer_address);

        match TcpStream::connect(peer_address).await {
            Ok(mut stream) => {
                let serialized_article = serde_json::to_string(article).expect("Failed to serialize article");
                if stream.write_all(serialized_article.as_bytes()).await.is_ok() {
                    println!("Sent article {} to peer at {}", article.id, peer_address);
                    return true;
                } else {
                    println!("Failed to send data to peer at {}", peer_address);
                }
            }
            Err(e) => {
                println!("Failed to connect to peer at {}: {}", peer_address, e);
            }
        }
        false
    }
}
