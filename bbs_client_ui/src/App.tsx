import React, { useState, useEffect } from 'react';
import { BBSClient } from './BBSClient';

// ForumPost Component for individual posts
const ForumPost = ({ post, onReply, onSelect }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState("");

    const handleReply = () => {
        if (replyContent.trim()) {
            onReply(post.id, replyContent);
            setReplyContent("");
            setShowReplyForm(false);
        }
    };

    return (
        <div
            onClick={() => onSelect(post)} // Select the post to show its replies
            style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "10px", cursor: "pointer" }}
        >
            <h5 style={{ marginBottom: "5px" }}>{post.title || "Untitled Post"}</h5>
            <p style={{ margin: "0 0 10px" }}>{post.content}</p>
            <div style={{ fontSize: "0.85em", color: "gray", marginBottom: "10px" }}>
                <p>ID: {post.id}</p>
                {post.parent_id && <p>Reply to: {post.parent_id}</p>}
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent selecting the article when clicking "Reply"
                    setShowReplyForm(!showReplyForm);
                }}
                style={{
                    backgroundColor: "#007bff",
                    color: "gray",
                    border: "none",
                    borderRadius: "5px",
                    padding: "5px 10px",
                    cursor: "pointer"
                }}
            >
                Reply
            </button>
            {showReplyForm && (
                <div style={{ marginTop: "10px" }}>
                    <textarea
                        placeholder="Write your reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={3}
                        style={{
                            width: "100%",
                            marginBottom: "10px",
                            padding: "8px",
                            borderRadius: "5px",
                            border: "1px solid #ccc"
                        }}
                    />
                    <button onClick={handleReply} style={{
                        backgroundColor: "#36454F",
                        color: "gray",
                        border: "none",
                        borderRadius: "5px",
                        padding: "5px 10px",
                        cursor: "pointer"
                    }}>
                        Submit Reply
                    </button>
                </div>
            )}
        </div>
    );
};

// Main App Component
const App: React.FC = () => {
    const [client, setClient] = useState<BBSClient | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [selectedArticle, setSelectedArticle] = useState<any | null>(null); // Track selected article for pane

    useEffect(() => {
        const newClient = new BBSClient("ws://localhost:8080", handleNewMessage);
        setClient(newClient);

        return () => newClient.closeConnection();
    }, []);

    const handleNewMessage = (message: string) => {
        try {
            const parsedMessage = JSON.parse(message);

            if (Array.isArray(parsedMessage)) {
                setMessages(parsedMessage);
            } else {
                setMessages((prevMessages) => [...prevMessages, parsedMessage]);
            }
        } catch (error) {
            console.error("Failed to parse message:", message);
        }
    };

    const handlePost = () => {
        if (client && input.trim()) {
            client.postArticle(input);
            setInput("");
        }
    };

    const handleRead = () => {
        client?.readArticles();
    };

    const handleReply = (parentId: string, content: string) => {
        if (client) {
            client.postArticle(`Reply to ${parentId}: ${content}`);
        }
    };

    // Close the selected article pane
    const closeArticlePane = () => {
        setSelectedArticle(null);
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "800px", margin: "0 auto" }}>
            <h2>Forum</h2>
            <div style={{ marginBottom: "20px" }}>
                <textarea
                    placeholder="Start a new discussion..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={4}
                    style={{
                        width: "100%",
                        marginBottom: "10px",
                        padding: "10px",
                        borderRadius: "5px",
                        border: "1px solid #ccc"
                    }}
                />
                <button
                    onClick={handlePost}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#007bff",
                        color: "gray",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        marginRight: "10px"
                    }}
                >
                    Post
                </button>
                <button
                    onClick={handleRead}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#36454F",
                        color: "gray",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer"
                    }}
                >
                    Refresh
                </button>
            </div>

            <div style={{ display: "flex" }}>
                <div style={{ flex: 1, maxHeight: "600px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", borderRadius: "5px", backgroundColor: "#36454F" }}>
                    <h4>Discussions:</h4>
                    {messages.filter((msg) => !msg.parent_id).length > 0 ? (
                        messages.filter((msg) => !msg.parent_id).map((msg, index) => (
                            <ForumPost key={index} post={msg} onReply={handleReply} onSelect={setSelectedArticle} />
                        ))
                    ) : (
                        <p>No posts yet. Start a new discussion!</p>
                    )}
                </div>

                {selectedArticle && (
                    <div style={{
                        width: "400px",
                        marginLeft: "20px",
                        padding: "15px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        backgroundColor: "#36454F",
                        position: "relative"
                    }}>
                        <button onClick={closeArticlePane} style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            background: "none",
                            border: "none",
                            fontSize: "1.2em",
                            cursor: "pointer"
                        }}>×</button>
                        <h4>{selectedArticle.title || "Untitled Post"}</h4>
                        <p>{selectedArticle.content}</p>
                        <div style={{ fontSize: "0.85em", color: "gray", marginBottom: "10px" }}>
                            <p>ID: {selectedArticle.id}</p>
                        </div>
                        <h5>Replies:</h5>
                        {messages
                            .filter((msg) => msg.parent_id === selectedArticle.id)
                            .map((reply, index) => (
                                <div key={index} style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#36454F", borderRadius: "5px", border: "1px solid #ccc" }}>
                                    <p><strong>{reply.title || "Reply"}</strong></p>
                                    <p>{reply.content}</p>
                                    <div style={{ fontSize: "0.75em", color: "gray" }}>ID: {reply.id}</div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
