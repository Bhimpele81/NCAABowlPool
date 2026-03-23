import React from 'react';

const PHASE_LABELS = {
  setup: 'Setup', picking: 'Picks Open', locked: 'Picks Locked', tracking: 'In Progress',
};

export default function NavBar({ page, setPage, phase }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="flag-icon">🏈</span>
          <span className="brand-title">Bowl Pool</span>
          <span className="brand-sub">Bill vs Don · 2025–26</span>
        </div>
        <nav className="header-nav">
          <button className={`nav-btn ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>Dashboard</button>
          <button className={`nav-btn ${page === 'picks' ? 'active' : ''}`} onClick={() => setPage('picks')}>Picks</button>
          <button className={`nav-btn ${page === 'admin' ? 'active' : ''}`} onClick={() => setPage('admin')}>⚙ Admin</button>
          <a
            href="https://nascarpool.onrender.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-btn"
          >🏁 Nascar Pool</a>
        </nav>
        <span className={`phase-badge phase-${phase}`}>{PHASE_LABELS[phase] || phase}</span>
      </div>
    </header>
  );
}
