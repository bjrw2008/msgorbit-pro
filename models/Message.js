const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chatId: {
    type: String,
    required: true
  },
  text: String,
  buttons: [{
    text: String,
    url: String,
    callbackData: String
  }],
  sendTime: {
    type: Date,
    required: true
  },
  repeat: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly', 'custom'],
    default: 'none'
  },
  customInterval: Number,
  sent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  sentAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);