const mongoose = require('mongoose');
const { Schema } = mongoose;

const MoveSchema = new Schema({
  player: String,
  column: Number,
  row: Number,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const PlayerSchema = new Schema({
  username: String,
  isBot: { type: Boolean, default: false }
}, { _id: false });

const GameSchema = new Schema({
  players: [PlayerSchema],
  moves: [MoveSchema],
  winner: { type: String, default: null },
  board: [[Number]],
  createdAt: { type: Date, default: Date.now },
  finishedAt: { type: Date, default: null },
  durationMs: { type: Number, default: 0 }
});

module.exports = mongoose.model('Game', GameSchema);
