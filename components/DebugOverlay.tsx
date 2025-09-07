import React from 'react';
import { useDebug } from '../contexts/DebugContext';

const DebugOverlay: React.FC = () => {
  const { logs, clearLogs } = useDebug();

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      width: 'calc(100% - 20px)',
      maxHeight: '200px',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      color: '#00FF00',
      fontFamily: 'monospace',
      fontSize: '11px',
      lineHeight: '1.4',
      padding: '8px',
      borderRadius: '4px',
      zIndex: 9999,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #333',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '5px', borderBottom: '1px solid #333', flexShrink: 0 }}>
        <h4 style={{ margin: 0, color: 'white', fontWeight: 'bold' }}>Mobile Debug Log</h4>
        <button onClick={clearLogs} style={{ background: '#333', color: 'white', border: '1px solid #555', padding: '2px 8px', borderRadius: '3px', cursor: 'pointer' }}>Clear</button>
      </div>
      <div style={{ flex: '1 1 auto', overflowY: 'auto', paddingTop: '5px', scrollbarWidth: 'thin' }}>
        {logs.length === 0 && <div style={{ color: '#888' }}>Waiting for logs...</div>}
        {logs.map((log, index) => (
          <div key={index} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            <span style={{ color: '#888', marginRight: '8px' }}>{log.timestamp}</span>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugOverlay;
