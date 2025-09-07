import React, { createContext, useState, useContext, useCallback } from 'react';

interface Log {
  timestamp: string;
  message: string;
}

interface DebugContextType {
  logs: Log[];
  log: (message: string) => void;
  clearLogs: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<Log[]>([]);

  const log = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    console.log(`[Debug] ${message}`); // Keep console logs too for desktop users
    setLogs(prevLogs => [{ timestamp, message }, ...prevLogs].slice(0, 50)); // Keep last 50 logs
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const value = { logs, log, clearLogs };

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
};

export const useDebug = (): DebugContextType => {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};
