import { Server } from 'socket.io';
import { Redis } from './redis.js';

const userSocketMap = new Map();

export const initializeSocket = async (server) => {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
        }
    });

    io.on("connection", (socket) => {
        socket.on("createRoom", async ({ roomId }, callback) => {
            await Redis.rpush(`room:${roomId}`, "__placeholder__");
            if (typeof callback === "function") {
                callback({ status: 'ok', message: "Room created successfully" });
            }
        });

        socket.on("joinRoom", async ({ name, roomId }, callback) => {
            let usersInRoom = await Redis.lrange(`room:${roomId}`, 0, -1);
            if(usersInRoom.length === 0) {
                callback({ status : 0, message : "Room not found" });
                return;
            }
            if (!usersInRoom.includes(name)) {
                await Redis.lrem(`room:${roomId}`, 1, "__placeholder__");
                await Redis.rpush(`room:${roomId}`, name);
                await Redis.expire(`room:${roomId}`, 86400);
            }

            socket.join(roomId);
            userSocketMap.set(socket.id, { name, roomId });

            socket.emit("roomJoined", { message: "Room joined successfully" });

            usersInRoom = await Redis.lrange(`room:${roomId}`, 0, -1);

            io.to(roomId).emit("updateUsersList", { users: usersInRoom });
        });

        socket.on("sendMessage", ({ fromName, message, roomId }) => {
            io.to(roomId).emit("messageReceived", { fromName, message });
        });

        socket.on("leaveRoom", async ({ name, roomId }, callback) => {
            await Redis.lrem(`room:${roomId}`, 1, name);
            const usersInRoom = await Redis.lrange(`room:${roomId}`, 0, -1);
            io.to(roomId).emit("updateUsersList", { users: usersInRoom });
            socket.leave(roomId);

            if (typeof callback === "function") {
                callback();
            }
        });

        socket.on("disconnect", async () => {
            const userData = userSocketMap.get(socket.id);
            if (userData) {
                const { name, roomId } = userData;

                await Redis.lrem(`room:${roomId}`, 1, name);
                const usersInRoom = await Redis.lrange(`room:${roomId}`, 0, -1);
                io.to(roomId).emit("updateUsersList", { users: usersInRoom });

                userSocketMap.delete(socket.id);
            }
        });
    });
}