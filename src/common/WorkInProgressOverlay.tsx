import React from 'react';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.7)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: '2.5rem',
  fontWeight: 'bold',
  letterSpacing: '2px',
  userSelect: 'none',
};

const WorkInProgressOverlay: React.FC = () => (
  <div style={overlayStyle}>
    WORK IN PROGRESS
  </div>
);

export default WorkInProgressOverlay;
