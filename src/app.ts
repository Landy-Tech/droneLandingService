import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import path from "path";
import { Server as SocketIOServer } from "socket.io";
import { setupDeliveryNamespace } from "./Sockets/DroneLandingNamespace";

// משתני סביבה
const port = process.env.PORT || 2000;
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// הגדרת סטטיקת קבצים
app.use("/assets", express.static(path.join(__dirname, "assets")));

// יצירת שרת HTTP
const server = http.createServer(app);

// הגדרת WebSocket עם Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
  },
  path: "/ws",  // נתיב זה תואם ללקוח
});

setupDeliveryNamespace(io);

// הפעלת השרת
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
