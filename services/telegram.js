const { Telegraf } = require('telegraf');

class TelegramService {
  async sendMessage(token, chatId, text, buttons = []) {
    try {
      const bot = new Telegraf(token);
      
      const replyMarkup = buttons.length > 0 ? {
        inline_keyboard: buttons.map(button => [
          {
            text: button.text,
            ...(button.url ? { url: button.url } : { callback_data: button.callbackData || 'button_click' })
          }
        ])
      } : undefined;

      await bot.telegram.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        ...(replyMarkup && { reply_markup: replyMarkup })
      });

      return { success: true };
    } catch (error) {
      console.error('Telegram error:', error);
      return { success: false, error: error.description || error.message };
    }
  }

  async verifyToken(token) {
    try {
      const bot = new Telegraf(token);
      const info = await bot.telegram.getMe();
      return { valid: true, username: info.username };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = new TelegramService();