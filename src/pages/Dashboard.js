import React, { useState, useEffect } from 'react';
import { calcTotals, calcGameResult, formatMoney, moneyClass } from '../utils/scoring';

function Countdown({ lockTime }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(lockTime) - new Date();
      if (diff <= 0) { setRemaining('Locked'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [lockTime]);
  return <span className="lock-countdown">{remaining}</span>;
}

export default function Dashboard({ state, updateState }) {
  const { games, picks, results, lockTime, phase } = state;

  if (!games || games.length === 0) {
    return (
      <div>
        <div className="dashboard-hero">
          <div>
            <div className="hero-season">2025–26 Season — Running Total</div>
            <div className="hero-leader">Bowl Pool</div>
            <div className="hero-sub">No games loaded yet</div>
          </div>
        </div>
        <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text-muted)' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🏈</div>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:6 }}>No Schedule Loaded</div>
          <div style={{ fontSize:13 }}>Head to Admin to upload the bowl schedule or add games manually.</div>
        </div>
      </div>
    );
  }

  const totals = calcTotals(games, results);
  const { billTotal, donTotal, billRecord, donRecord, billPickRecord, donPickRecord } = totals;
  const settledCount = games.filter(g => results[g.id]).length;

  const leaderName   = billTotal > donTotal ? 'Bill leads' : donTotal > billTotal ? 'Don leads' : 'Tied';
  const leaderAmount = billTotal > donTotal ? billTotal : donTotal > billTotal ? donTotal : 0;
  const leaderColor  = billTotal > donTotal ? 'var(--bill)' : donTotal > billTotal ? 'var(--don)' : 'var(--text-muted)';

  const setResult = (gameId, winner) => {
    if (!updateState) return;
    const nr = { ...results };
    if (nr[gameId] === winner) delete nr[gameId]; else nr[gameId] = winner;
    updateState({ results: nr });
  };

  const renderGame = (game) => {
    const result     = results[game.id];
    const billPick   = picks[game.id]?.bill   || game.team2;
    const donPick    = picks[game.id]?.don    || game.team1;
    const billSpread = picks[game.id]?.billSpread || game.spread2;
    const donSpread  = picks[game.id]?.donSpread  || game.spread1;
    const { billDelta, donDelta, settled } = calcGameResult(game, result);
    const pickerColor = game.billPicker ? 'var(--bill)' : 'var(--don)';

    return (
      <tr key={game.id} style={{ borderLeft: game.isCFP ? '3px solid var(--gold)' : '3px solid transparent' }}>
        <td style={{ color:'var(--text-muted)', fontSize:12, whiteSpace:'nowrap' }}>{game.date}</td>
        <td style={{ minWidth:160 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{
              fontSize:10, fontWeight:800, color:pickerColor,
              background:`color-mix(in srgb, ${pickerColor} 12%, transparent)`,
              border:`1px solid color-mix(in srgb, ${pickerColor} 25%, transparent)`,
              borderRadius:3, padding:'1px 5px', flexShrink:0,
            }}>{game.billPicker ? 'B' : 'D'}</span>
            {game.isCFP && <span style={{ fontSize:12 }}>🏆</span>}
            <span style={{ fontWeight:600, fontSize:13 }}>{game.name}</span>
          </div>
        </td>
        <td style={{ minWidth:130 }}>
          <span style={{ fontWeight:600, color:'var(--bill)', fontSize:13 }}>{billPick}</span>
          <span style={{ color:'var(--text-dim)', fontSize:11, marginLeft:4 }}>{billSpread}</span>
        </td>
        <td style={{ minWidth:130 }}>
          <span style={{ fontWeight:600, color:'var(--don)', fontSize:13 }}>{donPick}</span>
          <span style={{ color:'var(--text-dim)', fontSize:11, marginLeft:4 }}>{donSpread}</span>
        </td>
        <td style={{ whiteSpace:'nowrap' }}>
          <div style={{ display:'flex', gap:5 }}>
            <button onClick={() => setResult(game.id, 'bill')} style={{
              minWidth:52, height:34, borderRadius:'var(--radius-sm)',
              fontSize:13, fontWeight:700, cursor:'pointer',
              border: result === 'bill' ? '2px solid var(--blue)' : '1px solid var(--navy-border)',
              background: result === 'bill' ? 'var(--bill-bg)' : 'var(--navy-light)',
              color: result === 'bill' ? 'var(--bill)' : 'var(--text-muted)',
              transition:'all 0.15s', WebkitTapHighlightColor:'transparent',
            }}>Bill</button>
            <button onClick={() => setResult(game.id, 'don')} style={{
              minWidth:52, height:34, borderRadius:'var(--radius-sm)',
              fontSize:13, fontWeight:700, cursor:'pointer',
              border: result === 'don' ? '2px solid var(--red)' : '1px solid var(--navy-border)',
              background: result === 'don' ? 'var(--don-bg)' : 'var(--navy-light)',
              color: result === 'don' ? 'var(--don)' : 'var(--text-muted)',
              transition:'all 0.15s', WebkitTapHighlightColor:'transparent',
            }}>Don</button>
          </div>
        </td>
        <td className={`money-cell ${settled ? moneyClass(billDelta) : 'zero'}`} style={{ fontSize:13 }}>
          {settled ? formatMoney(billDelta) : <span style={{ color:'var(--text-dim)' }}>—</span>}
        </td>
        <td className={`money-cell ${settled ? moneyClass(donDelta) : 'zero'}`} style={{ fontSize:13 }}>
          {settled ? formatMoney(donDelta) : <span style={{ color:'var(--text-dim)' }}>—</span>}
        </td>
      </tr>
    );
  };

  return (
    <div>
      <div className="dashboard-hero">
        <div>
          <div className="hero-season">2025–26 Season — Running Total</div>
          <div className="hero-leader">
            <span style={{ color: leaderColor }}>{leaderName} </span>
            {leaderAmount !== 0 && <span className="amount">{formatMoney(leaderAmount)}</span>}
          </div>
          <div className="hero-sub">{settledCount} of {games.length} games settled</div>
        </div>
      </div>

      {phase === 'picking' && lockTime && (
        <div className="lock-banner">
          <span>🔒</span>
          <span className="lock-banner-text"><strong>Picks lock</strong> on {new Date(lockTime).toLocaleString()}</span>
          <Countdown lockTime={lockTime} />
        </div>
      )}

      <div className="scoreboard">
        <div className="score-card bill-card">
          <div className="score-card-name">Bill</div>
          <div className="score-card-meta">
            <div className="score-meta-item">Overall: <span>{billRecord}</span></div>
            <div className="score-meta-item">As Picker: <span>{billPickRecord}</span></div>
          </div>
        </div>
        <div className="score-card don-card">
          <div className="score-card-name">Don</div>
          <div className="score-card-meta">
            <div className="score-meta-item">Overall: <span>{donRecord}</span></div>
            <div className="score-meta-item">As Picker: <span>{donPickRecord}</span></div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:16, overflowX:'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Game</th>
              <th style={{ color:'var(--bill)' }}>Bill's Team</th>
              <th style={{ color:'var(--don)' }}>Don's Team</th>
              <th>Winner</th>
              <th className="num" style={{ color:'var(--bill)' }}>Bill $</th>
              <th className="num" style={{ color:'var(--don)' }}>Don $</th>
            </tr>
          </thead>
          <tbody>{games.map(renderGame)}</tbody>
        </table>
      </div>

      <div className="rules-strip">
        <span>🏈 Regular: Win <strong>+$5</strong> · Loss <strong>−$10</strong></span>
        <span>🏆 CFP: Win <strong>+$10</strong> · Loss <strong>−$20</strong></span>
        <span style={{ marginLeft:'auto', color:'var(--text-dim)', fontSize:11 }}>
          <strong style={{ color:'var(--bill)' }}>B</strong> / <strong style={{ color:'var(--don)' }}>D</strong> = picker
        </span>
      </div>
    </div>
  );
}
