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
            onClick={() => onSelect(post)}
            style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                marginBottom: "15px",
                backgroundColor: "#fff",
                cursor: "pointer",
                transition: "box-shadow 0.2s",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 3px 6px rgba(0, 0, 0, 0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.12)")}
        >
            <h5 style={{ marginBottom: "5px", fontSize: "1.1em", color: "#333" }}>{post.title || "Untitled Post"}</h5>
            <p style={{ margin: "0 0 15px", color: "#555" }}>{post.content}</p>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowReplyForm(!showReplyForm);
                }}
                style={{
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "0.9em",
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
                            border: "1px solid #ccc",
                            fontSize: "0.9em",
                        }}
                    />
                    <button
                        onClick={handleReply}
                        style={{
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            padding: "5px 10px",
                            cursor: "pointer",
                        }}
                    >
                        Submit Reply
                    </button>
                </div>
            )}
        </div>
    );
};

// Main App Component
const App = () => {
    const [client, setClient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedArticle, setSelectedArticle] = useState(null); // Track selected article for detail view
    const [showReplyForm, setShowReplyForm] = useState(false); // Toggle reply form in detail view
    const [replyContent, setReplyContent] = useState(""); // Reply content in detail view
    const postsPerPage = 5;

    useEffect(() => {
        const newClient = new BBSClient("ws://localhost:8080", handleNewMessage);
        setClient(newClient);
        return () => newClient.closeConnection();
    }, []);

    const handleNewMessage = (message: string) => {
        const parsedMessage = JSON.parse(message);
        setMessages((prevMessages) => Array.isArray(parsedMessage) ? parsedMessage : [...prevMessages, parsedMessage]);
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

    const handleReply = (parentId: any, content: string) => {
        client.postArticle(`Reply to ${parentId}: ${content}`);
        setReplyContent(""); // Reset reply form in detail view
        setShowReplyForm(false);
    };

    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = messages.slice(indexOfFirstPost, indexOfLastPost);

    const closeArticlePane = () => {
        setSelectedArticle(null);
        setShowReplyForm(false);
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "1000px", margin: "10 auto", color: "#333" }}>
            <h2 style={{ textAlign: "center", color: "#007bff", fontSize: "2em", marginBottom: "20px" }}>Bulletin Board System</h2>

            <div style={{ display: "flex" }}>
                <div style={{ flex: 1, paddingRight: "20px" }}>
                    <textarea
                        placeholder="Start a new discussion..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        rows={4}
                        style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "5px",
                            border: "1px solid #ccc",
                            marginBottom: "10px",
                            fontSize: "1em",
                            resize: "vertical",
                        }}
                    />
                    <button
                        onClick={handlePost}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            marginRight: "10px",
                            fontSize: "1em",
                        }}
                    >
                        Post
                    </button>
                    <button
                        onClick={handleRead}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontSize: "1em",
                        }}
                    >
                        Refresh
                    </button>

                    <div style={{ marginTop: "20px", maxHeight: "500px", overflowY: "auto", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9", padding: "15px" }}>
                        <h4 style={{ color: "#333", fontSize: "1.2em" }}>Discussions:</h4>
                        {currentPosts.length > 0 ? (
                            currentPosts.map((msg, index) => (
                                <ForumPost key={index} post={msg} onReply={handleReply} onSelect={setSelectedArticle} />
                            ))
                        ) : (
                            <p style={{ color: "#888", textAlign: "center" }}>No posts yet. Start a new discussion!</p>
                        )}
                    </div>

                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: currentPage === 1 ? "#ddd" : "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                marginRight: "5px",
                            }}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: "1em", color: "#555" }}>Page {currentPage}</span>
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={indexOfLastPost >= messages.length}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: indexOfLastPost >= messages.length ? "#ddd" : "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: indexOfLastPost >= messages.length ? "not-allowed" : "pointer",
                                marginLeft: "5px",
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>

                {selectedArticle && (
                    <div style={{
                        width: "400px",
                        padding: "20px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        backgroundColor: "#f0f0f0",
                        marginLeft: "20px",
                        position: "relative",
                    }}>
                        <button onClick={closeArticlePane} style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            background: "none",
                            border: "none",
                            fontSize: "1.2em",
                            cursor: "pointer",
                        }}>×</button>
                        <h4 style={{ marginBottom: "10px", color: "#007bff" }}>{selectedArticle.title || "Untitled Post"}</h4>
                        <p style={{ marginBottom: "10px", color: "#555" }}>{selectedArticle.content}</p>
                        <div style={{ fontSize: "0.85em", color: "#888", marginBottom: "20px" }}>
                            <p>ID: {selectedArticle.id}</p>
                        </div>
                        <button
                            onClick={() => setShowReplyForm(!showReplyForm)}
                            style={{
                                backgroundColor: "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                padding: "5px 10px",
                                cursor: "pointer",
                                fontSize: "0.9em",
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
                                        border: "1px solid #ccc",
                                        fontSize: "0.9em",
                                    }}
                                />
                                <button
                                    onClick={() => handleReply(selectedArticle.id, replyContent)}
                                    style={{
                                        backgroundColor: "#007bff",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "5px",
                                        padding: "5px 10px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Submit Reply
                                </button>
                            </div>
                        )}

                        <h5 style={{ color: "#333", marginTop: "20px" }}>Replies:</h5>
                        {messages
                            .filter((msg) => msg.parent_id === selectedArticle.id)
                            .map((reply, index) => (
                                <div key={index} style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#fff", borderRadius: "5px", border: "1px solid #ccc" }}>
                                    <p><strong>{reply.title || "Reply"}</strong></p>
                                    <p>{reply.content}</p>
                                    <div style={{ fontSize: "0.75em", color: "#888" }}>ID: {reply.id}</div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
