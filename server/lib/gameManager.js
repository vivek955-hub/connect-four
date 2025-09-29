const { v4: uuidv4 } = require('uuid');
const { createBoard, applyMove, cloneBoard, checkWin, checkDraw } = require('./rules');
const bot = require('./bot');
const GameModel = require('../models/Game');

const MATCHMAKING_TIMEOUT_MS = 10000;
const RECONNECT_TIMEOUT_MS = 30000;

class GameManager {
  constructor(io) {
    this.io = io;
    this.pendingQueue = [];
    this.games = new Map();
  }

  addPlayerToQueue({ socket, username }) {
    this.removePlayerFromQueue({ socket, username });

    const entry = { socket, username, joinAt: Date.now() };
    this.pendingQueue.push(entry);

    entry.timeoutHandle = setTimeout(() => {
      const idx = this.pendingQueue.findIndex(e => e === entry);
      if (idx !== -1) {
        this.pendingQueue.splice(idx, 1);
        this.createGameWithBot({ socket, username });
      }
    }, MATCHMAKING_TIMEOUT_MS);

    if (this.pendingQueue.length >= 2) {
      const p1 = this.pendingQueue.shift();
      clearTimeout(p1.timeoutHandle);
      const p2 = this.pendingQueue.shift();
      clearTimeout(p2.timeoutHandle);
      this.createGameWithPlayers(p1, p2);
    } else {
      socket.emit('waiting_for_opponent', { message: 'Waiting for opponent (10s timeout before bot)' });
    }
  }

  removePlayerFromQueue({ socket, username }) {
    const idx = this.pendingQueue.findIndex(e => e.username === username && e.socket.id === socket.id);
    if (idx !== -1) {
      const [entry] = this.pendingQueue.splice(idx, 1);
      if (entry.timeoutHandle) clearTimeout(entry.timeoutHandle);
    }
  }

  createGameWithPlayers(p1, p2) {
    const gameId = uuidv4();
    const board = createBoard();
    const game = {
      id: gameId,
      players: [
        { username: p1.username, socketId: p1.socket.id, token: 1, isBot: false },
        { username: p2.username, socketId: p2.socket.id, token: 2, isBot: false }
      ],
      board,
      moves: [],
      turnToken: 1,
      createdAt: Date.now(),
      status: 'active',
      reconnectTimers: {}
    };
    this.games.set(gameId, game);

    p1.socket.join(gameId);
    p2.socket.join(gameId);

    const payload = {
      gameId,
      players: game.players.map(p => ({ username: p.username, isBot: p.isBot, token: p.token })),
      board,
      yourToken: 1
    };
    p1.socket.emit('game_start', { ...payload, yourToken: 1 });
    p2.socket.emit('game_start', { ...payload, yourToken: 2 });

    this.io.to(gameId).emit('game_state', {
      board: game.board,
      turnToken: game.turnToken,
      moves: game.moves
    });
  }

  createGameWithBot({ socket, username }) {
    const gameId = uuidv4();
    const board = createBoard();
    const game = {
      id: gameId,
      players: [
        { username, socketId: socket.id, token: 1, isBot: false },
        { username: 'BOT_COMPETITIVE', socketId: null, token: 2, isBot: true }
      ],
      board,
      moves: [],
      turnToken: 1,
      createdAt: Date.now(),
      status: 'active',
      reconnectTimers: {}
    };
    this.games.set(gameId, game);

    socket.join(gameId);

    socket.emit('game_start', {
      gameId,
      players: game.players.map(p => ({ username: p.username, isBot: p.isBot, token: p.token })),
      board,
      yourToken: 1
    });

    this.io.to(gameId).emit('game_state', {
      board: game.board,
      turnToken: game.turnToken,
      moves: game.moves
    });
  }

  async handlePlayerMove({ socket, gameId, column }) {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'active') {
      socket.emit('error_msg', { message: 'Invalid or finished game' });
      return;
    }

    const player = game.players.find(p => p.socketId === socket.id || p.username === socket.data.username);
    if (!player) {
      socket.emit('error_msg', { message: 'You are not part of this game' });
      return;
    }

    if (game.turnToken !== player.token) {
      socket.emit('error_msg', { message: 'Not your turn' });
      return;
    }

    try {
      const { row } = applyMove(game.board, column, player.token);
      const move = { player: player.username, column, row, timestamp: new Date() };
      game.moves.push(move);

      const winnerCheck = checkWin(game.board, player.token);
      const draw = checkDraw(game.board);

      if (winnerCheck.win) {
        game.status = 'finished';
        const winnerName = player.username;
        game.finishedAt = Date.now();
        game.durationMs = game.finishedAt - game.createdAt;
        this.io.to(gameId).emit('move_made', { board: game.board, move, winner: winnerName, winningCoords: winnerCheck.coords });
        await this.persistCompletedGame(game, winnerName);
        this.games.delete(gameId);
        return;
      } else if (draw) {
        game.status = 'finished';
        const winnerName = 'draw';
        game.finishedAt = Date.now();
        game.durationMs = game.finishedAt - game.createdAt;
        this.io.to(gameId).emit('move_made', { board: game.board, move, winner: 'draw' });
        await this.persistCompletedGame(game, 'draw');
        this.games.delete(gameId);
        return;
      } else {
        game.turnToken = game.turnToken === 1 ? 2 : 1;
        this.io.to(gameId).emit('move_made', { board: game.board, move, winner: null, turnToken: game.turnToken });

        const nextPlayer = game.players.find(p => p.token === game.turnToken);
        if (nextPlayer && nextPlayer.isBot) {
          const botColumn = bot.chooseMove(game.board, nextPlayer.token, player.token);
          if (botColumn === -1) {
            game.status = 'finished';
            game.finishedAt = Date.now();
            game.durationMs = game.finishedAt - game.createdAt;
            this.io.to(gameId).emit('game_result', { winner: 'draw', reason: 'no moves for bot' });
            await this.persistCompletedGame(game, 'draw');
            this.games.delete(gameId);
            return;
          }
          try {
            const { row: brow } = applyMove(game.board, botColumn, nextPlayer.token);
            const botMove = { player: nextPlayer.username, column: botColumn, row: brow, timestamp: new Date() };
            game.moves.push(botMove);
            const botWinnerCheck = checkWin(game.board, nextPlayer.token);
            const botDraw = checkDraw(game.board);
            if (botWinnerCheck.win) {
              game.status = 'finished';
              const winnerName = nextPlayer.username;
              game.finishedAt = Date.now();
              game.durationMs = game.finishedAt - game.createdAt;
              this.io.to(gameId).emit('move_made', { board: game.board, move: botMove, winner: winnerName, winningCoords: botWinnerCheck.coords });
              await this.persistCompletedGame(game, winnerName);
              this.games.delete(gameId);
              return;
            } else if (botDraw) {
              game.status = 'finished';
              game.finishedAt = Date.now();
              game.durationMs = game.finishedAt - game.createdAt;
              this.io.to(gameId).emit('move_made', { board: game.board, move: botMove, winner: 'draw' });
              await this.persistCompletedGame(game, 'draw');
              this.games.delete(gameId);
              return;
            } else {
              game.turnToken = player.token;
              this.io.to(gameId).emit('move_made', { board: game.board, move: botMove, winner: null, turnToken: game.turnToken });
            }
          } catch (e) {
            console.error('Error applying bot move', e);
          }
        }
      }
    } catch (err) {
      socket.emit('error_msg', { message: err.message || 'Invalid move' });
    }
  }

  handleDisconnect({ socket, username }) {
    for (const [gameId, game] of this.games.entries()) {
      const p = game.players.find(pl => pl.socketId === socket.id || pl.username === username);
      if (!p) continue;
      p.socketId = null;
      const other = game.players.find(pl => pl.username !== p.username);
      this.io.to(gameId).emit('player_disconnected', { username: p.username, message: `${p.username} disconnected. Waiting ${RECONNECT_TIMEOUT_MS/1000}s for reconnect.` });

      if (game.reconnectTimers[p.username]) clearTimeout(game.reconnectTimers[p.username]);
      game.reconnectTimers[p.username] = setTimeout(async () => {
        if (!game.players.find(pl => pl.username === p.username && pl.socketId)) {
          game.status = 'finished';
          const winner = other ? other.username : (p.isBot ? 'BOT_COMPETITIVE' : null);
          game.finishedAt = Date.now();
          game.durationMs = game.finishedAt - game.createdAt;
          this.io.to(gameId).emit('game_forfeited', { winner, reason: `${p.username} did not reconnect in time` });
          await this.persistCompletedGame(game, winner || 'draw');
          this.games.delete(gameId);
        }
      }, RECONNECT_TIMEOUT_MS);
    }
  }

  handleReconnect({ socket, username, gameId }) {
    const game = this.games.get(gameId);
    if (!game) {
      socket.emit('error_msg', { message: 'Game not found or finished' });
      return;
    }
    const player = game.players.find(pl => pl.username === username);
    if (!player) {
      socket.emit('error_msg', { message: 'You are not a player in this game' });
      return;
    }
    player.socketId = socket.id;
    socket.join(gameId);

    if (game.reconnectTimers[player.username]) {
      clearTimeout(game.reconnectTimers[player.username]);
      delete game.reconnectTimers[player.username];
    }

    socket.emit('rejoin_success', {
      gameId,
      players: game.players.map(p => ({ username: p.username, token: p.token, isBot: p.isBot })),
      board: game.board,
      moves: game.moves,
      turnToken: game.turnToken
    });

    this.io.to(gameId).emit('player_rejoined', { username: player.username });
  }

  async persistCompletedGame(game, winnerName) {
    try {
      const doc = new GameModel({
        players: game.players.map(p => ({ username: p.username, isBot: p.isBot })),
        moves: game.moves,
        winner: winnerName,
        board: game.board,
        createdAt: new Date(game.createdAt),
        finishedAt: game.finishedAt ? new Date(game.finishedAt) : new Date(),
        durationMs: game.durationMs || 0
      });
      await doc.save();
      console.log('Saved completed game', doc._id);
    } catch (e) {
      console.error('Error saving completed game', e);
    }
  }
}

module.exports = GameManager;
