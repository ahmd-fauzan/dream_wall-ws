const WebSocket = require("ws");
const url = require("url");

const PORT = 8080;
const SERVER_KEY = "xIzsQQzw97VuSlup";

const wss = new WebSocket.Server({ port: PORT });
const clients = new Set(); 

console.log(`WebSocket Server running on port ${PORT}`);

wss.on("connection", (ws, req) => {
    
    // 1. Validasi Server Key terlebih dahulu
    const parameters = url.parse(req.url, true);
    const clientKey = parameters.query.key;

    if (clientKey !== SERVER_KEY) {
        console.log(`Koneksi ditolak (IP: ${req.socket.remoteAddress}): Key tidak valid.`);
        ws.close(1008, "Invalid Server Key");
        return; 
    }

    // 2. BATASAN CLIENT: Cek apakah server sudah penuh (Maksimal 2 client)
    if (clients.size >= 2) {
        console.log(`Koneksi ditolak (IP: ${req.socket.remoteAddress}): Server penuh (Maksimal 2 client).`);
        // Tolak koneksi dengan kode 1013 (Try Again Later)
        ws.close(1013, "Server Full"); 
        return;
    }

    // Jika aman dan belum penuh, masukkan ke daftar client
    console.log(`Client connected & Authenticated. (Total saat ini: ${clients.size + 1}/2)`);
    clients.add(ws);

    // Beritahu client bahwa koneksi sukses
    ws.send(JSON.stringify({ type: "system", sender: "Server", data: "CONNECTED" }));

    ws.on("message", (message) => {
        const messageString = message.toString();
        console.log("Received:", messageString);

        // Broadcast HANYA ke client yang bukan pengirim (Karena maksimal 2, otomatis hanya 1 arah lawan)
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client !== ws) {
                client.send(messageString);
            }
        });
    });

    ws.on("close", () => {
        clients.delete(ws);
        console.log(`Client disconnected. (Sisa client: ${clients.size}/2)`);
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});