import React from 'react';
import { useDebug } from '../contexts/DebugContext';

const DebugOverlay: React.FC = () => {
  const { logs, clearLogs } = useDebug();

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '10px',
    left: '10px',
    right: '10px', // Use right instead of width for better compatibility
    maxHeight: '30vh', // Use vh for height for more consistent sizing
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: '11px',
    lineHeight: 1.4,
    padding: '8px',
    borderRadius: '4px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #333',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '5px',
    borderBottom: '1px solid #333',
    flexShrink: 0,
    boxSizing: 'border-box',
  };

  const headerTextStyle: React.CSSProperties = {
    margin: 0,
    color: 'white',
    fontWeight: 'bold'
  };

  const buttonStyle: React.CSSProperties = {
    background: '#333',
    color: 'white',
    border: '1px solid #555',
    padding: '2px 8px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '11px',
  };

  const contentStyle: React.CSSProperties = {
    flex: '1 1 auto',
    overflowY: 'auto',
    paddingTop: '5px',
    scrollbarWidth: 'thin',
    WebkitOverflowScrolling: 'touch', // For smoother scrolling on iOS
    boxSizing: 'border-box',
    minHeight: 0, // A flexbox bug fix for some browsers where content overflows
  };

  const logEntryStyle: React.CSSProperties = {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  };

  const timestampStyle: React.CSSProperties = {
    color: '#888',
    marginRight: '8px',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h4 style={headerTextStyle}>Mobile Debug Log</h4>
        <button onClick={clearLogs} style={buttonStyle}>Clear</button>
      </div>
      <div style={contentStyle}>
        {logs.length === 0 && <div style={{ color: '#888' }}>Waiting for logs...</div>}
        {logs.map((log, index) => (
          <div key={index} style={logEntryStyle}>
            <span style={timestampStyle}>{log.timestamp}</span>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugOverlay;
