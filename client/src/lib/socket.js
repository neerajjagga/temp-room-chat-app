import io from 'socket.io-client';

export const makeSocketConnection = async () => {
    return io('https://temp-room-chat-app.onrender.com', {
        withCredentials: true,
        transports: ["websocket", "polling"],
    });
}