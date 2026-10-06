const WebSocket = require("ws");
const url = require("url");

const PORT = 8080;
const SERVER_KEY = "xIzsQQzw97VuSlup";

const wss = new WebSocket.Server({ port: PORT });
const rooms = new Map();

console.log(`WebSocket Server running on port ${PORT}`);

wss.on("connection", (ws, req) => {
    const parameters = url.parse(req.url, true);
    const clientKey = parameters.query.key;
    const targetRoomCode = parameters.query.room; // Langsung ambil dari URL

    // 1. Validasi Server Key
    if (clientKey !== SERVER_KEY) {
        console.log(`Koneksi ditolak: Key tidak valid.`);
        ws.close(1008, "Invalid Server Key");
        return; 
    }

    // 2. Validasi apakah client menyertakan kode room
    if (!targetRoomCode) {
        console.log(`Koneksi ditolak: Room code kosong.`);
        ws.close(1008, "Room Code Required");
        return; 
    }

    // Buat room di memori jika belum ada
    if (!rooms.has(targetRoomCode)) {
        rooms.set(targetRoomCode, new Set());
    }

    const room = rooms.get(targetRoomCode);

    // 3. Cek Batasan Room (Maksimal 2 Client)
    if (room.size >= 2) {
        console.log(`Koneksi ditolak: Room [${targetRoomCode}] sudah penuh.`);
        ws.close(1013, "Room Full"); 
        return;
    }

    // 4. Jika lolos semua, masukkan client ke room
    room.add(ws);
    ws.roomCode = targetRoomCode;
    console.log(`Client masuk ke Room [${targetRoomCode}]. (Total: ${room.size}/2)`);

    // Beritahu client bahwa dia berhasil masuk
    ws.send(JSON.stringify({ type: "system", sender: "Server", data: "CONNECTED" }));

    // Handle Pesan Normal
    ws.on("message", (message) => {
        const messageString = message.toString();
        // Langsung broadcast ke teman di room yang sama
        room.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client !== ws) {
                client.send(messageString);
                console.log(messageString);
            }
        });
    });

    ws.on("close", () => {
        room.delete(ws);
        console.log(`Client keluar dari Room [${ws.roomCode}]. (Sisa: ${room.size}/2)`);
        
        if (room.size === 0) {
            rooms.delete(ws.roomCode);
            console.log(`Room [${ws.roomCode}] dihapus.`);
        }
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});