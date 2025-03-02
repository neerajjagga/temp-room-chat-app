import io from 'socket.io-client';

export const makeSocketConnection = async () => {
    return io('http://localhost:3000');
}