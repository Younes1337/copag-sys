import { useState, useEffect, useCallback } from 'react';
import { 
  getDetectionData, 
  updateDetectionCounts, 
  getDetectionStats, 
  resetDetectionData,
  exportDetectionData,
  importDetectionData 
} from '@/utils/detectionStorage';

/**
 * Custom hook for managing detection data storage
 * Uses JSON file simulation via localStorage
 */
export const useDetectionStorage = () => {
  const [detectionData, setDetectionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    try {
      const data = getDetectionData();
      setDetectionData(data);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  // Listen for storage changes (when other parts of the app update storage)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const data = getDetectionData();
        setDetectionData(data);
      } catch (err) {
        console.error('Error refreshing detection data:', err);
      }
    };

    const handleDetectionUpdate = (event) => {
      console.log('🔔 Detection data updated event received:', event.detail);
      setDetectionData(event.detail);
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom detection update events
    window.addEventListener('detectionDataUpdated', handleDetectionUpdate);
    
    // Also check for changes every 5 seconds (fallback)
    const interval = setInterval(handleStorageChange, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('detectionDataUpdated', handleDetectionUpdate);
      clearInterval(interval);
    };
  }, []);

  // Update detection counts
  const addDetections = useCallback(async (newDetections) => {
    try {
      const success = updateDetectionCounts(newDetections);
      if (success) {
        // Reload data after update
        const updatedData = getDetectionData();
        setDetectionData(updatedData);
      }
      return success;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Get current statistics
  const getStats = useCallback(() => {
    return getDetectionStats();
  }, []);

  // Reset all data
  const resetData = useCallback(() => {
    try {
      const success = resetDetectionData();
      if (success) {
        setDetectionData(getDetectionData());
      }
      return success;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Export data
  const exportData = useCallback(() => {
    try {
      exportDetectionData();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Import data
  const importData = useCallback(async (file) => {
    try {
      setIsLoading(true);
      const importedData = await importDetectionData(file);
      setDetectionData(importedData);
      setIsLoading(false);
      return true;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Refresh data from storage
  const refreshData = useCallback(() => {
    try {
      const data = getDetectionData();
      setDetectionData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return {
    // State
    detectionData,
    isLoading,
    error,
    
    // Actions
    addDetections,
    getStats,
    resetData,
    exportData,
    importData,
    refreshData,
    
    // Computed values
    totalDetections: detectionData?.totalDetections || 0,
    detectionCounts: detectionData?.detectionCounts || {},
    lastUpdated: detectionData?.lastUpdated
  };
};
