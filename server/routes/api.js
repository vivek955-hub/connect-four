const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const mongoose = require('mongoose');

router.get('/leaderboard', async (req, res) => {
  try {
    const agg = await Game.aggregate([
      { $match: { winner: { $ne: null, $ne: 'draw' } } },
      { $group: { _id: "$winner", wins: { $sum: 1 } } },
      { $sort: { wins: -1 } },
      { $limit: 20 }
    ]);
    const result = agg.map(x => ({ username: x._id, wins: x.wins }));
    res.json({ success: true, leaderboard: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/game/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const g = await Game.findById(id).lean();
    if (!g) return res.status(404).json({ success: false, message: 'Game not found' });
    res.json({ success: true, game: g });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/completed-games', async (req, res) => {
  try {
    const games = await Game.find().sort({ finishedAt: -1 }).limit(50).lean();
    res.json({ success: true, games });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
