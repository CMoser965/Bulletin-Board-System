export class BBSClient {
    private ws: WebSocket;
    private onMessageCallback: (message: string) => void;

        constructor(url: string | URL, onMessageCallback: { (message: any): void; (message: string): void; }) {
            this.ws = new WebSocket(url);
            this.onMessageCallback = onMessageCallback;
    
            this.ws.onmessage = (event) => this.onMessageCallback(event.data);
            this.ws.onerror = (error) => this.retryConnect(url);
        }
    
        retryConnect(url: string | URL) {
            setTimeout(() => {
                this.ws = new WebSocket(url);
                this.ws.onmessage = (event) => this.onMessageCallback(event.data);
            }, 1000);
        }
    
        postArticle(content: any) {
            this.ws.send(`POST ${content}`);
        }
    
        readArticles() {
            this.ws.send("READ");
        }
    
        closeConnection() {
            this.ws.close();
        }
    }
    