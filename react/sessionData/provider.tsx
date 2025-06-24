import { createContext, useContext, ReactNode } from 'react';

interface SessionDataConfig {
  sessionEndpoint: string;
}

const SessionDataContext = createContext<SessionDataConfig | null>(null);

interface SessionDataProviderProps {
  children: ReactNode;
  sessionEndpoint: string;
}

export function SessionDataProvider({ 
  children, 
  sessionEndpoint 
}: SessionDataProviderProps) {
  const config = {
    sessionEndpoint
  };

  return (
    <SessionDataContext.Provider value={config}>
      {children}
    </SessionDataContext.Provider>
  );
}

export function useSessionDataConfig() {
  const context = useContext(SessionDataContext);
  if (!context) {
    throw new Error('useSessionDataConfig must be used within a SessionDataProvider');
  }
  return context;
}