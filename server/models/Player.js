

const mongoose = require('mongoose');
const { Schema } = mongoose;

const PlayerSchema = new Schema({
  username: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Player', PlayerSchema);
