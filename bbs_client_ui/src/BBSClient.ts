export class BBSClient {
    private ws: WebSocket;
    private onMessageCallback: (message: string) => void;

    constructor(url: string, onMessageCallback: (message: string) => void) {
        this.ws = new WebSocket(url);
        this.onMessageCallback = onMessageCallback;

        this.ws.onopen = () => console.log("Connected to WebSocket server.");

        this.ws.onmessage = (event) => {
            console.log("Received:", event.data);
            this.onMessageCallback(event.data);
        };

        this.ws.onerror = (error) => console.error("WebSocket error:", error);
        this.ws.onclose = () => console.log("Disconnected from WebSocket server.");
    }

    postArticle(content: string) {
        this.ws.send(`POST ${content}`);
    }

    readArticles() {
        this.ws.send("READ");
    }

    closeConnection() {
        this.ws.close();
    }
}
