import { useState, useEffect, useCallback, useRef } from 'react';
import { telegramService } from '@/services/telegramService';

/**
 * Hook for managing Telegram alerts based on detection data
 */
export const useTelegramAlerts = (detectionData, detectionCounts, concentration, videoElement) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastAlertTimes, setLastAlertTimes] = useState({});
  const [alertStatus, setAlertStatus] = useState({});
  const alertHistoryRef = useRef([]);
  
  // State tracking for persistent dangerous behaviors (10-second confirmation)
  const [dangerousStateStart, setDangerousStateStart] = useState({});
  const [lastDetectionCounts, setLastDetectionCounts] = useState({});
  const [alertSentForState, setAlertSentForState] = useState({});

  // Initialize Telegram service
  useEffect(() => {
    const initializeTelegram = async () => {
      const status = telegramService.getStatus();
      setIsEnabled(status.enabled);
      setLastAlertTimes(status.lastAlertTimes);
      
      // Test connection
      const connectionOk = await telegramService.testConnection();
      setAlertStatus(prev => ({
        ...prev,
        connectionOk,
        lastTest: new Date().toISOString()
      }));
    };

    initializeTelegram();
  }, []);


  // Check for sleep detection
  const checkSleepDetection = useCallback(async (detectionData) => {
    console.log('😴 Checking sleep detection:', detectionData);
    
    if (!isEnabled) {
      console.log('❌ Sleep detection not checked - Alerts disabled');
      return;
    }
    
    if (!detectionData || !Array.isArray(detectionData)) {
      console.log('❌ Sleep detection not checked - No detection data');
      return;
    }

    // Check for sleep-related detections
    const sleepDetections = detectionData.filter(detection => 
      detection.class === 'SleepyDriving' && 
      detection.confidence > 0.7
    );

    console.log('😴 Sleep detections found:', sleepDetections.length);

    if (sleepDetections.length > 0) {
      console.log('😴 Sleep detection triggered with confidence:', sleepDetections[0].confidence);
      
      // Check cooldown
      const lastAlertTime = telegramService.lastAlertTimes['sleepAlert'];
      const cooldownTime = telegramService.config.cooldown.sleepAlert;
      const timeSinceLastAlert = lastAlertTime ? Date.now() - lastAlertTime : 0;
      
      if (timeSinceLastAlert < cooldownTime) {
        console.log('❌ Sleep alert in cooldown. Time remaining:', Math.round((cooldownTime - timeSinceLastAlert) / 1000) + 's');
        return;
      }
      
      const detectionInfo = {
        confidence: sleepDetections[0].confidence,
        duration: 'Continuous detection',
        count: sleepDetections.length
      };

      const success = await telegramService.sendSleepAlert(null, detectionInfo);
      
      if (success) {
        setAlertStatus(prev => ({
          ...prev,
          lastSleepAlert: new Date().toISOString()
        }));
      } else {
        console.log('❌ Failed to send sleep alert');
      }
    } else {
      console.log('😴 No sleep detections found');
    }
  }, [isEnabled]);

  // Check for dangerous behaviors
  const checkDangerousBehaviors = useCallback(async (detectionCounts) => {
    if (!isEnabled) {
      return;
    }
    
    if (!detectionCounts || typeof detectionCounts !== 'object') {
      return;
    }

    const now = Date.now();
    const persistenceTime = 10000; // 10 seconds to confirm dangerous state
    const alertCooldown = 30000; // 30 seconds between alerts

    // Check if dangerous states are persistent (10 seconds)
    const currentDangerousStates = {
      sleepy: detectionCounts.SleepyDriving > 0,
      dangerous: detectionCounts.DangerousDriving > 0,
      drinking: detectionCounts.Drinking > 0
    };

    // Update state tracking - only start timer if not already started
    Object.keys(currentDangerousStates).forEach(state => {
      if (currentDangerousStates[state]) {
        if (!dangerousStateStart[state]) {
          console.log(`🕐 ${state} state started at:`, new Date().toLocaleTimeString());
          setDangerousStateStart(prev => ({ ...prev, [state]: now }));
          // Reset alert flag when new state starts
          setAlertSentForState(prev => ({ ...prev, [state]: false }));
        }
      } else {
        if (dangerousStateStart[state]) {
          setDangerousStateStart(prev => ({ ...prev, [state]: null }));
          // Reset alert flag when state ends to allow new alerts
          setAlertSentForState(prev => ({ ...prev, [state]: false }));
        }
      }
    });

    // Check for persistent SleepyDriving (10 seconds)
    if (currentDangerousStates.sleepy && dangerousStateStart.sleepy) {
      const stateDuration = now - dangerousStateStart.sleepy;
      
      if (stateDuration >= persistenceTime && !alertSentForState.sleepy) {
        const lastAlertTime = telegramService.lastAlertTimes['sleepAlert'] || 0;
        const timeSinceLastAlert = now - lastAlertTime;
        
        if (timeSinceLastAlert >= alertCooldown) {
          
          try {
            const additionalData = {
              detectionCounts: detectionCounts,
              timestamp: new Date().toISOString(),
              stateDuration: Math.round(stateDuration/1000)
            };
            
            // Send text-only alert
            await telegramService.sendAlert('sleepAlert', '😴 Persistent sleepy driving detected! Please take a break immediately.', null, additionalData);
            
            setAlertStatus(prev => ({
              ...prev,
              lastSleepAlert: new Date().toISOString()
            }));
            
            // Mark alert as sent for this state
            setAlertSentForState(prev => ({ ...prev, sleepy: true }));
          } catch (error) {
            console.error('❌ Failed to send sleep driving alert:', error);
          }
        }
      }
    }

    // Check for persistent DangerousDriving (10 seconds)
    if (currentDangerousStates.dangerous && dangerousStateStart.dangerous) {
      const stateDuration = now - dangerousStateStart.dangerous;
      
      if (stateDuration >= persistenceTime && !alertSentForState.dangerous) {
        const lastAlertTime = telegramService.lastAlertTimes['dangerousDriving'] || 0;
        const timeSinceLastAlert = now - lastAlertTime;
        
        if (timeSinceLastAlert >= alertCooldown) {
          
          try {
            const additionalData = {
              detectionCounts: detectionCounts,
              timestamp: new Date().toISOString(),
              stateDuration: Math.round(stateDuration/1000)
            };
            
            // Send text-only alert
            await telegramService.sendAlert('dangerousDriving', '⚠️ Persistent dangerous driving detected! Please drive safely immediately.', null, additionalData);
            
            setAlertStatus(prev => ({
              ...prev,
              lastDangerousAlert: new Date().toISOString()
            }));
            
            // Mark alert as sent for this state
            setAlertSentForState(prev => ({ ...prev, dangerous: true }));
          } catch (error) {
            console.error('❌ Failed to send dangerous driving alert:', error);
          }
        }
      }
    }

    // Check for persistent Drinking (10 seconds)
    if (currentDangerousStates.drinking && dangerousStateStart.drinking) {
      const stateDuration = now - dangerousStateStart.drinking;
      
      if (stateDuration >= persistenceTime && !alertSentForState.drinking) {
        const lastAlertTime = telegramService.lastAlertTimes['drinking'] || 0;
        if (now - lastAlertTime >= alertCooldown) {
          
          try {
            const additionalData = {
              detectionCounts: detectionCounts,
              timestamp: new Date().toISOString(),
              stateDuration: Math.round(stateDuration/1000)
            };
            
            // Send text-only alert
            await telegramService.sendAlert('drinking', '🍺 Persistent drinking while driving detected! This is extremely dangerous.', null, additionalData);
            
            setAlertStatus(prev => ({
              ...prev,
              lastDrinkingAlert: new Date().toISOString()
            }));
            
            // Mark alert as sent for this state
            setAlertSentForState(prev => ({ ...prev, drinking: true }));
          } catch (error) {
            console.error('❌ Failed to send drinking alert:', error);
          }
        }
      }
    }


    // Update last detection counts for comparison
    setLastDetectionCounts(detectionCounts);
  }, [isEnabled, dangerousStateStart, alertSentForState, concentration]);

  // Check for dangerous driving
  const checkDangerousDriving = useCallback(async (detectionCounts) => {
    if (!isEnabled || !detectionCounts.DangerousDriving || detectionCounts.DangerousDriving === 0) return;

    console.log('🚨 Dangerous driving detected');
    
    const detectionInfo = {
      confidence: 'High',
      count: detectionCounts.DangerousDriving
    };

    const success = await telegramService.sendDangerousDrivingAlert(imageData, detectionInfo);
    
    if (success) {
      setAlertStatus(prev => ({
        ...prev,
        lastDangerousDrivingAlert: new Date().toISOString()
      }));
    }
  }, [isEnabled]);

  // Check for drinking
  const checkDrinking = useCallback(async (detectionCounts) => {
    if (!isEnabled || !detectionCounts.Drinking || detectionCounts.Drinking === 0) return;

    console.log('🍺 Drinking detected');
    
    const detectionInfo = {
      confidence: 'High',
      count: detectionCounts.Drinking
    };

    const success = await telegramService.sendDrinkingAlert(imageData, detectionInfo);
    
    if (success) {
      setAlertStatus(prev => ({
        ...prev,
        lastDrinkingAlert: new Date().toISOString()
      }));
    }
  }, [isEnabled]);

  // Monitor detection data for alerts
  useEffect(() => {
    if (!detectionData || !Array.isArray(detectionData)) {
      return;
    }
    
    // Check for sleep detection
    checkSleepDetection(detectionData);
  }, [detectionData, checkSleepDetection]);

  // Monitor detection counts for dangerous behaviors
  useEffect(() => {
    if (!detectionCounts || typeof detectionCounts !== 'object') {
      return;
    }

    if (!isEnabled) {
      return;
    }

    checkDangerousBehaviors(detectionCounts);
  }, [detectionCounts, isEnabled, checkDangerousBehaviors]);

  // Monitor concentration for low concentration alerts
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    if (concentration !== undefined && concentration !== null && concentration <= 25) {
      console.log('🚨 Low concentration detected:', concentration + '%');
      
      const lastAlertTime = telegramService.lastAlertTimes['lowConcentration'] || 0;
      const alertCooldown = 30000; // 30 seconds between concentration alerts
      
      if (Date.now() - lastAlertTime >= alertCooldown) {
        console.log('🚨 Sending low concentration alert:', concentration + '%');
        
        const additionalData = {
          concentration: concentration,
          detectionCounts: detectionCounts,
          timestamp: new Date().toISOString()
        };
        
        // Send text-only alert
        telegramService.sendAlert('lowConcentration', `⚠️ Low concentration detected: ${concentration}%! Please focus on driving safely.`, null, additionalData)
          .then(() => {
            setAlertStatus(prev => ({
              ...prev,
              lastConcentrationAlert: new Date().toISOString()
            }));
          })
          .catch(error => {
            console.error('❌ Failed to send low concentration alert:', error);
          });
      } else {
        console.log('⏰ Low concentration alert on cooldown');
      }
    }
  }, [concentration, isEnabled, detectionCounts]);

  // Monitor detection counts for dangerous behaviors
  useEffect(() => {
    if (!detectionData || !Array.isArray(detectionData)) return;

    // Get current detection counts from storage
    const storageData = JSON.parse(localStorage.getItem('detectionData') || '{}');
    const detectionCounts = storageData.detectionCounts || {};

    // Check for dangerous driving
    checkDangerousDriving(detectionCounts);
    
    // Check for drinking
    checkDrinking(detectionCounts);
  }, [detectionData, checkDangerousDriving, checkDrinking]);

  // Toggle alerts on/off
  const toggleAlerts = useCallback((enabled) => {
    setIsEnabled(enabled);
    telegramService.setEnabled(enabled);
  }, []);

  // Test Telegram connection
  const testConnection = useCallback(async () => {
    const connectionOk = await telegramService.testConnection();
    setAlertStatus(prev => ({
      ...prev,
      connectionOk,
      lastTest: new Date().toISOString()
    }));
    return connectionOk;
  }, []);

  // Send test alert
  const sendTestAlert = useCallback(async () => {
    if (!isEnabled) return false;
    
    const testMessage = "🧪 Test alert from Driver Monitoring System";
    const additionalData = {
      timestamp: new Date().toISOString(),
      test: true
    };
    
    return await telegramService.sendAlert('test', testMessage, null, additionalData);
  }, [isEnabled]);

  return {
    // State
    isEnabled,
    alertStatus,
    lastAlertTimes,
    
    // Actions
    toggleAlerts,
    testConnection,
    sendTestAlert,
    
    // Status
    isConnected: alertStatus.connectionOk,
    lastTest: alertStatus.lastTest
  };
};
