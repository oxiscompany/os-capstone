import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TelemetrySnapshot, Computer, Alert } from '../api/types';
import { api } from '../api/client';

interface SimulationContextType {
  snapshot: TelemetrySnapshot | null;
  computers: Computer[];
  isConnected: boolean;
  isSimulating: boolean;
  isPaused: boolean;
  speedMultiplier: number;
  recentAlerts: Alert[];
  startSimulation: () => Promise<void>;
  pauseSimulation: () => Promise<void>;
  resumeSimulation: () => Promise<void>;
  stopSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
  refreshManual: () => Promise<void>;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const fetchFallback = async () => {
    try {
      const data = await api.getLiveMetrics();
      setSnapshot(data);
      const alertsData = await api.getAlerts({ limit: 15 });
      setRecentAlerts(alertsData);
    } catch (err) {
      // Background retry
    }
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/monitoring`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'INITIAL_TELEMETRY' || message.type === 'TELEMETRY_UPDATE') {
            setSnapshot(message.data);
          } else if (message.type === 'ALERT_TRIGGERED') {
            const newAlerts = Array.isArray(message.data) ? message.data : [message.data];
            setRecentAlerts((prev) => [...newAlerts, ...prev].slice(0, 30));
          }
        } catch (e) {
          console.error('Error parsing WebSocket message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnection after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    }
  };

  useEffect(() => {
    fetchFallback();
    connectWebSocket();

    // Fallback polling every 3 seconds if WebSocket is disconnected
    const pollInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        fetchFallback();
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const startSimulation = async () => {
    await api.startSimulation();
    await fetchFallback();
  };

  const pauseSimulation = async () => {
    await api.pauseSimulation();
    await fetchFallback();
  };

  const resumeSimulation = async () => {
    await api.resumeSimulation();
    await fetchFallback();
  };

  const stopSimulation = async () => {
    await api.stopSimulation();
    await fetchFallback();
  };

  const resetSimulation = async () => {
    await api.resetSimulation();
    await fetchFallback();
  };

  const setSpeed = async (speed: number) => {
    await api.setSimulationConfig({ speed_multiplier: speed });
    await fetchFallback();
  };

  const isSimulating = snapshot?.simulation_state?.is_running ?? true;
  const isPaused = snapshot?.simulation_state?.is_paused ?? false;
  const speedMultiplier = snapshot?.simulation_state?.speed_multiplier ?? 1.0;
  const computers = snapshot?.computers ?? [];

  return (
    <SimulationContext.Provider
      value={{
        snapshot,
        computers,
        isConnected,
        isSimulating,
        isPaused,
        speedMultiplier,
        recentAlerts,
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        stopSimulation,
        resetSimulation,
        setSpeed,
        refreshManual: fetchFallback,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
};
