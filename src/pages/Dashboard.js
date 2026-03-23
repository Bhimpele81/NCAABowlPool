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

  return (
    <div>
      {/* Hero */}
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

      {/* Lock banner */}
      {phase === 'picking' && lockTime && (
        <div className="lock-banner">
          <span>🔒</span>
          <span className="lock-banner-text"><strong>Picks lock</strong> on {new Date(lockTime).toLocaleString()}</span>
          <Countdown lockTime={lockTime} />
        </div>
      )}

      {/* Score cards */}
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

      {/* Game rows — card layout, mobile-first */}
      <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
        {games.map(game => {
          const result   = results[game.id];
          const billPick = picks[game.id]?.bill;
          const donPick  = picks[game.id]?.don;
          const { billDelta, donDelta, settled } = calcGameResult(game, result);
          const pickerColor = game.billPicker ? 'var(--bill)' : 'var(--don)';
          const pickerLabel = game.billPicker ? 'B' : 'D';

          return (
            <div key={game.id} style={{
              background: 'var(--navy-card)',
              border: `1px solid ${result ? 'var(--navy-border)' : 'var(--navy-border)'}`,
              borderLeft: game.isCFP ? '3px solid var(--gold)' : '3px solid transparent',
              borderRadius: 'var(--radius)',
              padding: '10px 12px',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gridTemplateRows: 'auto auto',
              gap: '6px 12px',
              alignItems: 'center',
              minHeight: 64,
            }}>
              {/* Top left: date + game name */}
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{
                  fontSize:10, fontWeight:700, color:pickerColor,
                  background:`color-mix(in srgb, ${pickerColor} 15%, transparent)`,
                  border:`1px solid color-mix(in srgb, ${pickerColor} 30%, transparent)`,
                  borderRadius:3, padding:'1px 5px', flexShrink:0,
                }}>{pickerLabel}</span>
                {game.isCFP && <span style={{ fontSize:13 }}>🏆</span>}
                <span style={{ fontWeight:600, fontSize:13 }}>{game.name}</span>
                {game.isCFP && <span className="badge badge-cfp">2×</span>}
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{game.date}</span>
              </div>

              {/* Top right: winner buttons */}
              <div style={{ display:'flex', gap:5, justifyContent:'flex-end' }}>
                <button
                  onClick={() => setResult(game.id, 'bill')}
                  style={{
                    minWidth: 52, padding:'7px 10px',
                    borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:700,
                    cursor:'pointer', transition:'all 0.15s', border:'1px solid',
                    borderColor: result === 'bill' ? 'var(--blue)' : 'rgba(96,165,250,0.2)',
                    background:  result === 'bill' ? 'var(--bill-bg)' : 'var(--navy-light)',
                    color:       result === 'bill' ? 'var(--bill)' : 'var(--text-muted)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >Bill</button>
                <button
                  onClick={() => setResult(game.id, 'don')}
                  style={{
                    minWidth: 52, padding:'7px 10px',
                    borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:700,
                    cursor:'pointer', transition:'all 0.15s', border:'1px solid',
                    borderColor: result === 'don' ? 'var(--red)' : 'rgba(248,113,113,0.2)',
                    background:  result === 'don' ? 'var(--don-bg)' : 'var(--navy-light)',
                    color:       result === 'don' ? 'var(--don)' : 'var(--text-muted)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >Don</button>
              </div>

              {/* Bottom left: team picks */}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <span style={{ fontSize:12 }}>
                  <span style={{ color:'var(--bill)', fontWeight:600 }}>
                    {billPick || game.team2}
                  </span>
                  <span style={{ color:'var(--text-dim)', marginLeft:3, fontSize:11 }}>
                    {picks[game.id]?.billSpread || game.spread2}
                  </span>
                </span>
                <span style={{ color:'var(--text-dim)', fontSize:12 }}>vs</span>
                <span style={{ fontSize:12 }}>
                  <span style={{ color:'var(--don)', fontWeight:600 }}>
                    {donPick || game.team1}
                  </span>
                  <span style={{ color:'var(--text-dim)', marginLeft:3, fontSize:11 }}>
                    {picks[game.id]?.donSpread || game.spread1}
                  </span>
                </span>
              </div>

              {/* Bottom right: money */}
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', fontSize:12, fontVariantNumeric:'tabular-nums' }}>
                {settled ? (
                  <>
                    <span style={{ fontWeight:700, color: billDelta >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      B:{formatMoney(billDelta)}
                    </span>
                    <span style={{ fontWeight:700, color: donDelta >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      D:{formatMoney(donDelta)}
                    </span>
                  </>
                ) : (
                  <span style={{ color:'var(--text-dim)' }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rules */}
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
