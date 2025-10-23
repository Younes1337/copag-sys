import { useState, useEffect, useCallback, useRef } from "react";

interface Detection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
  timestamp: number;
}

interface PredictionData {
  detections: Detection[];
  timestamp: number;
  frame_count: number;
  total_detections: number;
  frame_data?: string;
  counts?: Record<string, number>;
}

interface WebSocketMessage {
  type: 'prediction' | 'status' | 'pong' | 'camera_status' | 'inference_status';
  data?: PredictionData | { camera_active: boolean; message: string; running?: boolean };
  counts?: Record<string, number>;
}

export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [detectionCounts, setDetectionCounts] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [inferenceRunning, setInferenceRunning] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setIsProcessing(true);
      reconnectAttempts.current = 0;
      
      // Send ping to establish connection
      ws.send(JSON.stringify({ type: 'ping' }));
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected", event.code, event.reason);
      setIsConnected(false);
      setIsProcessing(false);
      setInferenceRunning(false);
      
      // Attempt to reconnect if not a clean close
      if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
      setIsProcessing(false);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        
        if (message.type === 'prediction' && message.data) {
          // Type guard to ensure message.data is PredictionData
          if ('detections' in message.data) {
            setPredictions(message.data);
            setIsProcessing(true);
            
            // Update detection counts if available
            if (message.data.counts) {
              setDetectionCounts(message.data.counts);
            }
          } else {
            console.warn("Received 'prediction' message with unexpected data format:", message.data);
          }
        }
        
        if (message.type === 'status' && message.data) {
          if ('counts' in message.data && message.data.counts) {
            setDetectionCounts(message.data.counts);
          }
          if ('inference_running' in message.data && typeof message.data.inference_running === 'boolean') {
            setInferenceRunning(message.data.inference_running);
          }
        }
        
        if (message.type === 'camera_status') {
          console.log('Camera status:', message.data);
          if (message.data && 'camera_active' in message.data) {
            setInferenceRunning(message.data.camera_active);
          }
        }
        
        if (message.type === 'inference_status') {
          console.log('Inference status:', message.data);
          if (message.data && 'running' in message.data) {
            setInferenceRunning(message.data.running);
          }
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    setSocket(ws);
  }, [url, maxReconnectAttempts]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback(
    (message: unknown) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        console.warn("WebSocket is not connected");
      }
    },
    [socket]
  );

  return { 
    isConnected, 
    lastMessage, 
    predictions, 
    detectionCounts, 
    isProcessing, 
    inferenceRunning,
    sendMessage 
  };
};
