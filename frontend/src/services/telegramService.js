import { getTelegramConfig, validateTelegramConfig } from '@/config/telegram';

class TelegramService {
  constructor() {
    this.config = getTelegramConfig();
    this.lastAlertTimes = {};
    this.isEnabled = false;
    
    // Validate configuration
    const validation = validateTelegramConfig(this.config);
    if (!validation.isValid) {
      console.warn('⚠️ Telegram configuration invalid:', validation.errors);
      this.isEnabled = false;
    } else {
      this.isEnabled = true;
    }
  }

  /**
   * Send alert with image to Telegram
   */
  async sendAlert(alertType, message, imageData = null, additionalData = {}) {
    console.log('📱 sendAlert called:', { alertType, message, hasImage: !!imageData, isEnabled: this.isEnabled });
    
    if (!this.isEnabled) {
      console.log('📱 Telegram alerts disabled - configuration invalid');
      return false;
    }

    // Check cooldown
    if (this.isInCooldown(alertType)) {
      console.log(`📱 Alert ${alertType} in cooldown, skipping`);
      return false;
    }

    try {
      const fullMessage = this.formatMessage(alertType, message, additionalData);
      console.log('📱 Formatted message:', fullMessage);
      
      if (imageData) {
        // Send photo with caption
        console.log('📱 Sending photo with caption...');
        await this.sendPhoto(fullMessage, imageData);
      } else {
        // Send text message
        console.log('📱 Sending text message...');
        await this.sendMessage(fullMessage);
      }

      // Update last alert time
      this.lastAlertTimes[alertType] = Date.now();
      
      console.log(`📱 Telegram alert sent successfully: ${alertType}`);
      return true;
    } catch (error) {
      console.error('📱 Telegram alert failed:', error);
      console.error('📱 Error details:', error.message, error.stack);
      return false;
    }
  }

  /**
   * Send sleep detection alert
   */
  async sendSleepAlert(imageData, detectionData) {
    const message = this.config.messages.sleepAlert;
    const additionalData = {
      timestamp: new Date().toISOString(),
      confidence: detectionData.confidence || 'N/A',
      duration: detectionData.duration || 'N/A'
    };
    
    return await this.sendAlert('sleepAlert', message, imageData, additionalData);
  }

  /**
   * Send low concentration alert
   */
  async sendLowConcentrationAlert(imageData, concentrationData) {
    const message = this.config.messages.lowConcentrationAlert;
    const additionalData = {
      timestamp: new Date().toISOString(),
      concentration: concentrationData.concentration,
      totalDetections: concentrationData.totalDetections,
      safeDriving: concentrationData.safeDriving,
      otherDetections: concentrationData.otherDetections
    };
    
    return await this.sendAlert('lowConcentration', message, imageData, additionalData);
  }

  /**
   * Send dangerous driving alert
   */
  async sendDangerousDrivingAlert(imageData, detectionData) {
    const message = this.config.messages.dangerousDrivingAlert;
    const additionalData = {
      timestamp: new Date().toISOString(),
      confidence: detectionData.confidence || 'N/A',
      count: detectionData.count || 0
    };
    
    return await this.sendAlert('dangerousDriving', message, imageData, additionalData);
  }

  /**
   * Send drinking alert
   */
  async sendDrinkingAlert(imageData, detectionData) {
    const message = this.config.messages.drinkingAlert;
    const additionalData = {
      timestamp: new Date().toISOString(),
      confidence: detectionData.confidence || 'N/A',
      count: detectionData.count || 0
    };
    
    return await this.sendAlert('drinking', message, imageData, additionalData);
  }

  /**
   * Check if alert type is in cooldown
   */
  isInCooldown(alertType) {
    const lastTime = this.lastAlertTimes[alertType];
    if (!lastTime) return false;
    
    const cooldownMs = this.config.cooldown[alertType] || 30000;
    return (Date.now() - lastTime) < cooldownMs;
  }

  /**
   * Format message with additional data
   */
  formatMessage(alertType, message, additionalData) {
    let formattedMessage = message;
    
    if (additionalData.timestamp) {
      formattedMessage += `\n\n🕐 Time: ${new Date(additionalData.timestamp).toLocaleString()}`;
    }
    
    if (additionalData.concentration !== undefined) {
      formattedMessage += `\n📊 Concentration: ${additionalData.concentration}%`;
    }
    
    if (additionalData.confidence !== undefined) {
      formattedMessage += `\n🎯 Confidence: ${additionalData.confidence}`;
    }
    
    if (additionalData.totalDetections !== undefined) {
      formattedMessage += `\n📈 Total Detections: ${additionalData.totalDetections}`;
    }
    
    if (additionalData.safeDriving !== undefined) {
      formattedMessage += `\n✅ Safe Driving: ${additionalData.safeDriving}`;
    }
    
    if (additionalData.otherDetections !== undefined) {
      formattedMessage += `\n⚠️ Other Detections: ${additionalData.otherDetections}`;
    }
    
    return formattedMessage;
  }

  /**
   * Send photo to Telegram
   */
  async sendPhoto(caption, imageData) {
    
    if (!imageData) {
      console.error('📷 No image data provided to sendPhoto');
      throw new Error('No image data provided');
    }
    
    const formData = new FormData();
    formData.append('chat_id', this.config.chatId);
    formData.append('caption', caption);
    formData.append('photo', imageData, 'alert.jpg');
    formData.append('parse_mode', 'HTML');


    // Use proxy in development to avoid CORS issues
    const baseUrl = import.meta.env.DEV 
      ? '/api/telegram' 
      : 'https://api.telegram.org';

    const response = await fetch(`${baseUrl}/bot${this.config.botToken}/sendPhoto`, {
      method: 'POST',
      body: formData
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error('📷 Telegram API error:', response.status, errorText);
      throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Send text message to Telegram
   */
  async sendMessage(text) {
    // Use proxy in development to avoid CORS issues
    const baseUrl = import.meta.env.DEV 
      ? '/api/telegram' 
      : 'https://api.telegram.org';

    const response = await fetch(`${baseUrl}/bot${this.config.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: this.config.chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Telegram API error:', response.status, errorText);
      throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Test Telegram connection
   */
  async testConnection() {
    try {
      // Use proxy in development to avoid CORS issues
      const baseUrl = import.meta.env.DEV 
        ? '/api/telegram' 
        : 'https://api.telegram.org';

      const response = await fetch(`${baseUrl}/bot${this.config.botToken}/getMe`);
      const data = await response.json();
      
      if (data.ok) {
        return true;
      } else {
        console.error('❌ Telegram bot connection failed:', data.description);
        return false;
      }
    } catch (error) {
      console.error('❌ Telegram bot connection error:', error);
      return false;
    }
  }

  /**
   * Enable/disable alerts
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`📱 Telegram alerts ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get alert status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      configValid: validateTelegramConfig(this.config).isValid,
      lastAlertTimes: this.lastAlertTimes,
      cooldowns: this.config.cooldown
    };
  }

  /**
   * Send a simple test alert (no image required)
   */
  async sendTestAlert() {
    console.log('📱 Sending test alert...');
    const testMessage = "🧪 Test alert from Driver Monitoring System";
    const additionalData = {
      timestamp: new Date().toISOString(),
      test: true
    };
    
    return await this.sendAlert('test', testMessage, null, additionalData);
  }
}

// Export singleton instance
export const telegramService = new TelegramService();
export default telegramService;
