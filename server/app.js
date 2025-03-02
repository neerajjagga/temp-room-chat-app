import express from 'express'
import { createServer } from 'http';
import cors from 'cors';
import { initializeSocket } from './socket.js';

const app = express();
app.use(cors({
    origin : "http://localhost:5173",
    credentials : true,
}))

const server = createServer(app);

server.listen(3000, () => {
    console.log("Server is listening on port 3000");
    initializeSocket(server);
});