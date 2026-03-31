const express = require('express');
const router = express.Router();
const Bot = require('../models/Bot');
const ActivityLog = require('../models/ActivityLog');
const { authMiddleware, checkPermission } = require('../middleware/auth');

router.use(authMiddleware);

// Get all bots
router.get('/', async (req, res) => {
  try {
    const bots = await Bot.find({ createdBy: req.user._id });
    res.json(bots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bots' });
  }
});

// Add new bot (skip verification)
router.post('/', checkPermission('manageBots'), async (req, res) => {
  try {
    const { name, token } = req.body;

    const newBot = new Bot({
      name,
      token,
      username: name,
      createdBy: req.user._id
    });

    await newBot.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'add_bot',
      details: { botName: name }
    });

    res.status(201).json({ message: 'Bot added', bot: newBot });
  } catch (error) {
    res.status(400).json({ error: 'Failed to add bot' });
  }
});

// Remove bot
router.delete('/:id', checkPermission('manageBots'), async (req, res) => {
  try {
    const bot = await Bot.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'remove_bot',
      details: { botName: bot.name }
    });

    res.json({ message: 'Bot removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove bot' });
  }
});

module.exports = router;
