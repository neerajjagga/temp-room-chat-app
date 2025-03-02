import { Server } from 'socket.io';
import { Redis } from './redis.js';

export const initializeSocket = async (server) => {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected to websocket server");

        socket.on("joinRoom", async ({ name, roomId }) => {
            let usersInRoom = await Redis.lrange(`room:${roomId}`, 0, -1);
            if (!usersInRoom.includes(name)) {
                await Redis.rpush(`room:${roomId}`, name);
                await Redis.expire(`room:${roomId}`, 86400);
            }

            socket.join(roomId);

            socket.emit("roomJoined", { message: "Room joined successfully" });

            usersInRoom = await Redis.lrange(`room:${roomId}`, 0, -1);

            io.to(roomId).emit("updateUsersList", { users: usersInRoom });
        });


        socket.on("sendMessage", ({ fromName, message, roomId }) => {
            console.log("Inside sendMessage");
            console.log(fromName + " " + message + " " + roomId);
            io.to(roomId).emit("messageReceived", { fromName, message });
        });

        socket.on("leaveRoom", async ({ name, roomId }, callback) => {
            console.log("Inside leaveRoom");
            console.log(name + roomId);

            await Redis.lrem(`room:${roomId}`, 1, name);
            console.log(`User disconnected with ${socket.id}`);
            const usersInRoom = await Redis.lrange(`room:${roomId}`, 0, -1);
            console.log(usersInRoom);
            io.to(roomId).emit("updateUsersList", { users: usersInRoom });
            socket.leave(roomId);

            if (typeof callback === "function") {
                callback();
            }
        });
    });
}