const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Bot = require('../models/Bot');
const ActivityLog = require('../models/ActivityLog');
const telegramService = require('../services/telegram');
const { authMiddleware, checkPermission } = require('../middleware/auth');

router.use(authMiddleware);

// Get all messages
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.user._id })
      .populate('botId', 'name username')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create message
router.post('/', async (req, res) => {
  try {
    const { botId, chatId, text, buttons, sendTime, repeat, customInterval } = req.body;

    const bot = await Bot.findOne({ _id: botId, createdBy: req.user._id });
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    const message = new Message({
      botId,
      userId: req.user._id,
      chatId,
      text,
      buttons: buttons || [],
      sendTime: new Date(sendTime),
      repeat: repeat || 'none',
      customInterval: customInterval || null
    });

    await message.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'schedule_message',
      details: { messageId: message._id, chatId, sendTime }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to schedule message' });
  }
});

// Delete message
router.delete('/:id', async (req, res) => {
  try {
    const message = await Message.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!message) return res.status(404).json({ error: 'Message not found' });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'delete_message',
      details: { messageId: message._id }
    });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Send test message
router.post('/test', checkPermission('addButtons'), async (req, res) => {
  try {
    const { botId, chatId, text, buttons } = req.body;

    const bot = await Bot.findOne({ _id: botId, createdBy: req.user._id });
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    const result = await telegramService.sendMessage(bot.token, chatId, text, buttons);

    await ActivityLog.create({
      userId: req.user._id,
      action: 'test_message',
      details: { chatId, success: result.success }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send test message' });
  }
});

module.exports = router;