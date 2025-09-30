/**
 * Main server - Express + Socket.IO
 *
 * Responsibilities:
 *  - HTTP API routes (leaderboard, get game)
 *  - WebSocket events (matchmaking, moves, reconnect)
 *  - Persist completed games to MongoDB
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const apiRoutes = require('./routes/api');
const GameManager = require('./lib/gameManager');

const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:5173', 'https://connect-four-rma3.vercel.app'],
  credentials: true
}));


const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = 'https://connect-four-rma3.vercel.app/';

const app = express();
app.use(express.json());
app.use(cors({ origin: CLIENT_ORIGIN }));

// routes
app.use('/api', apiRoutes);

// basic health
app.get('/', (req, res) => {
  res.send('Connect Four server is running');
});

const server = http.createServer(app);

// socket.io
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// connect to MongoDB
const MONGODB_URI ='mongodb+srv://vivekreddy701327_db_user:63CjGHGZioTJAAst@clustervivek.6lreuz0.mongodb.net/connect_four';
mongoose.connect(MONGODB_URI).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});

// initialize global GameManager
const gameManager = new GameManager(io);

// socket handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // join queue: expects { username }
  socket.on('join_queue', async ({ username }) => {
    if (!username) {
      socket.emit('error_msg', { message: 'username required' });
      return;
    }
    console.log(`User ${username} joined queue (socket ${socket.id})`);
    socket.data.username = username;
    gameManager.addPlayerToQueue({ socket, username });
  });

  // client requests to rejoin game
  socket.on('rejoin_game', ({ username, gameId }) => {
    if (!username || !gameId) {
      socket.emit('error_msg', { message: 'username and gameId required' });
      return;
    }
    socket.data.username = username;
    console.log(`Socket ${socket.id} attempting rejoin for ${username} in game ${gameId}`);
    gameManager.handleReconnect({ socket, username, gameId });
  });

  // player makes a move: { gameId, column }
  socket.on('make_move', ({ gameId, column }) => {
    if (!gameId || typeof column !== 'number') {
      socket.emit('error_msg', { message: 'gameId and numeric column required' });
      return;
    }
    gameManager.handlePlayerMove({ socket, gameId, column });
  });

  // explicit leave
  socket.on('leave_queue', () => {
    const username = socket.data.username;
    gameManager.removePlayerFromQueue({ socket, username });
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id} reason: ${reason}`);
    const username = socket.data.username;
    // inform gameManager
    gameManager.handleDisconnect({ socket, username });
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

