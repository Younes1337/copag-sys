/**
 * Detection Data Storage Utility
 * Handles reading and writing detection data to/from JSON file
 */

const STORAGE_KEY = 'detection_data';
const DEFAULT_DATA = {
  totalDetections: 0,
  detectionCounts: {},
  lastUpdated: null,
  sessionData: []
};

// Throttling for real-time updates
let lastUpdateTime = 0;
const UPDATE_THROTTLE_MS = 100; // Minimum 100ms between updates

/**
 * Get detection data from localStorage (JSON file simulation)
 */
export const getDetectionData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        ...DEFAULT_DATA,
        ...data,
        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : null
      };
    }
    return DEFAULT_DATA;
  } catch (error) {
    console.error('Error reading detection data:', error);
    return DEFAULT_DATA;
  }
};

/**
 * Save detection data to localStorage (JSON file simulation)
 */
export const saveDetectionData = (data) => {
  try {
    const dataToSave = {
      ...data,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    console.log('💾 Detection data saved:', dataToSave);
    return true;
  } catch (error) {
    console.error('Error saving detection data:', error);
    return false;
  }
};

/**
 * Update detection counts in storage (throttled for real-time updates)
 */
export const updateDetectionCounts = (newDetections) => {
  const now = Date.now();
  
  // Throttle updates to prevent excessive storage writes
  if (now - lastUpdateTime < UPDATE_THROTTLE_MS) {
    // Queue the update for later processing
    setTimeout(() => updateDetectionCounts(newDetections), UPDATE_THROTTLE_MS - (now - lastUpdateTime));
    return true; // Return true to indicate update is queued
  }
  
  lastUpdateTime = now;
  
  const currentData = getDetectionData();
  const updatedCounts = { ...currentData.detectionCounts };
  
  // Add new detections to existing counts
  Object.entries(newDetections).forEach(([className, count]) => {
    updatedCounts[className] = (updatedCounts[className] || 0) + count;
  });
  
  const totalDetections = Object.values(updatedCounts).reduce((sum, count) => sum + count, 0);
  
  const updatedData = {
    ...currentData,
    totalDetections,
    detectionCounts: updatedCounts,
    sessionData: [
      ...currentData.sessionData,
      {
        timestamp: new Date().toISOString(),
        detections: newDetections,
        totalDetections
      }
    ].slice(-100) // Keep last 100 sessions
  };
  
  const success = saveDetectionData(updatedData);
  
  // Dispatch custom event to notify components of storage update
  if (success) {
    window.dispatchEvent(new CustomEvent('detectionDataUpdated', { 
      detail: updatedData 
    }));
    console.log('⚡ Real-time storage update:', updatedData.detectionCounts);
  }
  
  return success;
};

/**
 * Reset detection data
 */
export const resetDetectionData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Detection data reset');
    return true;
  } catch (error) {
    console.error('Error resetting detection data:', error);
    return false;
  }
};

/**
 * Get detection statistics
 */
export const getDetectionStats = () => {
  const data = getDetectionData();
  const totalDetections = data.totalDetections;
  const detectionCounts = data.detectionCounts;
  
  if (totalDetections === 0) {
    return {
      totalDetections: 0,
      detectionCounts: {},
      percentages: {},
      mostCommonDetection: null,
      lastUpdated: data.lastUpdated
    };
  }
  
  // Calculate percentages
  const percentages = {};
  Object.entries(detectionCounts).forEach(([className, count]) => {
    percentages[className] = Math.round((count / totalDetections) * 100);
  });
  
  // Find most common detection
  const mostCommonDetection = Object.entries(detectionCounts)
    .sort(([,a], [,b]) => b - a)[0];
  
  return {
    totalDetections,
    detectionCounts,
    percentages,
    mostCommonDetection: mostCommonDetection ? {
      class: mostCommonDetection[0],
      count: mostCommonDetection[1],
      percentage: percentages[mostCommonDetection[0]]
    } : null,
    lastUpdated: data.lastUpdated
  };
};

/**
 * Export detection data as JSON
 */
export const exportDetectionData = () => {
  const data = getDetectionData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `detection_data_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('📁 Detection data exported');
};

/**
 * Import detection data from JSON file
 */
export const importDetectionData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (saveDetectionData(data)) {
          console.log('📁 Detection data imported:', data);
          resolve(data);
        } else {
          reject(new Error('Failed to save imported data'));
        }
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
