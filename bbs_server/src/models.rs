// src/models.rs

use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Article {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub parent_id: Option<Uuid>, // For replies to other articles
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ArticleList {
    pub articles: Vec<Article>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum ServerResponse {
    Success(Article),
    Failure(String),
    ArticleList(Vec<Article>),
}
