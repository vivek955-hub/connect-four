import { io } from 'socket.io-client';

const SERVER = import.meta.env.VITE_SERVER_URL || 'https://connect-four-van4.onrender.com';

const socket = io(SERVER, {
  autoConnect: true
});

export default socket;
