const WebSocket = require("ws");

const PORT = 8080;

const wss = new WebSocket.Server({
    port: PORT
});

const clients = new Set();

console.log(`WebSocket Server running on port ${PORT}`);

wss.on("connection", (ws) => {

    console.log("Client connected");

    clients.add(ws);

    ws.send("CONNECTED");

    ws.on("message", (message) => {

        const text = message.toString();

        console.log("Received:", text);

        // Kirim ke semua client
        clients.forEach((client) => {

            if (client.readyState === WebSocket.OPEN) {
                client.send(text);
            }

        });
    });

    ws.on("close", () => {

        console.log("Client disconnected");

        clients.delete(ws);

    });

    ws.on("error", (error) => {

        console.error("WebSocket error:", error);

    });
});