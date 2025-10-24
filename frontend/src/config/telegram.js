// Telegram Bot Configuration
// Get your bot token from @BotFather on Telegram

export const TELEGRAM_CONFIG = {
  // Your Telegram Bot Token (get from @BotFather)
  botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "YOUR_BOT_TOKEN_HERE",
  
  // Chat ID where alerts will be sent (get from @userinfobot)
  chatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || "YOUR_CHAT_ID_HERE",
  
  // Alert thresholds
  thresholds: {
    sleepDetection: true,        // Alert when sleeping detected
    lowConcentration: 25,       // Alert when concentration < 25%
    dangerousDriving: true,     // Alert when dangerous driving detected
    drinking: true,             // Alert when drinking detected
  },
  
  // Message templates
  messages: {
    sleepAlert: "🚨 SLEEP ALERT! Driver appears to be sleeping. Immediate attention required!",
    lowConcentrationAlert: "⚠️ LOW CONCENTRATION ALERT! Driver concentration is below 25%. Please check driver status.",
    dangerousDrivingAlert: "🚨 DANGEROUS DRIVING ALERT! Dangerous driving behavior detected!",
    drinkingAlert: "🚨 DRINKING ALERT! Driver appears to be drinking while driving!",
  },
  
  // Cooldown settings (prevent spam)
  cooldown: {
    sleepAlert: 30000,          // 30 seconds between sleep alerts
    lowConcentration: 15000,   // 15 seconds between concentration alerts (reduced for testing)
    dangerousDriving: 15000,   // 15 seconds between dangerous driving alerts
    drinking: 20000,           // 20 seconds between drinking alerts
  }
};

// Validation function
export const validateTelegramConfig = (config) => {
  const errors = [];
  
  if (!config.botToken || config.botToken === "YOUR_BOT_TOKEN_HERE") {
    errors.push("Please set your Telegram bot token");
  }
  
  if (!config.chatId || config.chatId === "YOUR_CHAT_ID_HERE") {
    errors.push("Please set your Telegram chat ID");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get configuration with environment variables
export const getTelegramConfig = () => {
  return {
    ...TELEGRAM_CONFIG,
    botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || TELEGRAM_CONFIG.botToken,
    chatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || TELEGRAM_CONFIG.chatId,
  };
};
