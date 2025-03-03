import express from 'express'
import { createServer } from 'http';
import cors from 'cors';
import { initializeSocket } from './socket.js';
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors({
    origin: "https://temp-room-chat-app.vercel.app/",
    credentials: true,
}))

const server = createServer(app);

server.listen(PORT, () => {
    console.log("Server is listening on port 3000");
    initializeSocket(server);
});