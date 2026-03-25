import React from 'react';

const PHASE_LABELS = {
  setup: 'Setup', picking: 'Picks Open', locked: 'Picks Locked', tracking: 'In Progress',
};

export default function NavBar({ page, setPage, phase, syncing, online }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-brand">
          <img src="/bowl-season.png" alt="Bowl Season" style={{ height:36, width:'auto' }} />
        </div>
        <nav className="header-nav">
          <button className={`nav-btn ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>Dashboard</button>
          <button className={`nav-btn ${page === 'picks' ? 'active' : ''}`} onClick={() => setPage('picks')}>Picks</button>
          <button className={`nav-btn ${page === 'admin' ? 'active' : ''}`} onClick={() => setPage('admin')}>Admin</button>
          <a href="https://nascarpool.onrender.com/" target="_blank" rel="noopener noreferrer" className="nav-btn">Nascar Pool</a>
          <a href="https://pgagolfpool.onrender.com/" target="_blank" rel="noopener noreferrer" className="nav-btn">PGA Pool</a>
        </nav>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {syncing && (
            <span style={{ fontSize:11, color:'var(--text-muted)', fontStyle:'italic' }}>Saving...</span>
          )}
          {!syncing && !online && (
            <span style={{ fontSize:11, color:'var(--red)' }}>● Offline</span>
          )}
          {!syncing && online && (
            <span style={{ fontSize:11, color:'var(--green)' }}>● Live</span>
          )}
          <span className={`phase-badge phase-${phase}`}>{PHASE_LABELS[phase] || phase}</span>
        </div>
      </div>
    </header>
  );
}
