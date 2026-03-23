import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { calcGameResult, formatMoney } from '../utils/scoring';

let nextId = Date.now();
const uid = () => String(++nextId);

function parseCSV(rows) {
  return rows
    .filter(r => r['Game'] || r['game'])
    .map(r => {
      const name      = (r['Game']        || r['game']        || '').trim();
      const date      = (r['Date']        || r['date']        || '').trim();
      const team1     = (r['Team1']       || r['team1']       || r['Don']  || '').trim();
      const spread1   = (r['Spread1']     || r['spread1']     || r['DonSpread'] || '').trim();
      const team2     = (r['Team2']       || r['team2']       || r['Bill'] || '').trim();
      const spread2   = (r['Spread2']     || r['spread2']     || r['BillSpread'] || '').trim();
      const cfp       = (r['CFP']         || r['cfp']         || '').trim();
      const firstPick = (r['FirstPicker'] || r['firstPicker'] || r['First'] || 'Bill').trim();
      const isCFP     = ['true','yes','1','cfp','x'].includes(cfp.toLowerCase());
      const billFirst = firstPick.toLowerCase() === 'bill';
      return { id: uid(), name, date, team1, spread1, team2, spread2, isCFP, billPicker: billFirst, donPicker: !billFirst };
    })
    .filter(g => g.name);
}

function Toast({ msg, onDone }) {
  React.useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return <div className="toast">✓ {msg}</div>;
}

export default function AdminPanel({ state, updateState }) {
  const { games, picks, results, lockTime, phase } = state;
  const [toast, setToast] = useState(null);
  const fileRef = useRef();
  const [form, setForm] = useState({ name:'', date:'', team1:'', spread1:'', team2:'', spread2:'', isCFP:false, firstPicker:'Bill' });
  const [lockInput, setLockInput] = useState(lockTime ? new Date(lockTime).toISOString().slice(0,16) : '');

  const showToast = (msg) => setToast(msg);

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: ({ data }) => {
        const parsed = parseCSV(data);
        if (!parsed.length) { showToast('No valid games found in CSV'); return; }
        updateState({ games: parsed, picks: {}, results: {} });
        showToast(`Loaded ${parsed.length} games`);
      },
      error: () => showToast('CSV parse error'),
    });
    e.target.value = '';
  };

  const handleAdd = () => {
    if (!form.name || !form.team1 || !form.team2) return;
    const g = {
      id: uid(), name: form.name.trim(), date: form.date.trim(),
      team1: form.team1.trim(), spread1: form.spread1.trim(),
      team2: form.team2.trim(), spread2: form.spread2.trim(),
      isCFP: form.isCFP, billPicker: form.firstPicker === 'Bill', donPicker: form.firstPicker === 'Don',
    };
    updateState({ games: [...games, g] });
    setForm({ name:'', date:'', team1:'', spread1:'', team2:'', spread2:'', isCFP:false, firstPicker:'Bill' });
    showToast(`Added: ${g.name}`);
  };

  const handleRemove = (id) => {
    const nr = { ...results }; delete nr[id];
    const np = { ...picks };   delete np[id];
    updateState({ games: games.filter(g => g.id !== id), results: nr, picks: np });
  };

  const toggleCFP = (id) => updateState({ games: games.map(g => g.id === id ? { ...g, isCFP: !g.isCFP } : g) });

  const setResult = (gameId, winner) => {
    const nr = { ...results };
    if (nr[gameId] === winner) delete nr[gameId]; else nr[gameId] = winner;
    updateState({ results: nr });
  };

  const setPhase = (p) => { updateState({ phase: p }); showToast(`Phase: ${p}`); };

  const saveLockTime = () => {
    updateState({ lockTime: lockInput ? new Date(lockInput).toISOString() : null });
    showToast('Lock time saved');
  };

  const clearAll = () => {
    if (!window.confirm('Clear ALL data?')) return;
    updateState({ games: [], picks: {}, results: {}, lockTime: null, phase: 'setup' });
    setLockInput('');
    showToast('All data cleared');
  };

  const settledCount = games.filter(g => results[g.id]).length;
  const unsettledGames = games.filter(g => !results[g.id]);
  const settledGames   = games.filter(g =>  results[g.id]);

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--text-muted)', marginBottom:20 }}>
        Admin Panel
      </div>

      <div className="admin-grid">
        {/* Phase Control */}
        <div className="card">
          <div className="card-header"><span className="card-title">Phase Control</span></div>
          <div className="card-body">
            <label className="form-label">Current Phase</label>
            <div className="phase-control" style={{ marginBottom:16 }}>
              {[
                { key:'setup',    label:'⚙ Setup'      },
                { key:'picking',  label:'✏ Picks Open' },
                { key:'locked',   label:'🔒 Locked'     },
                { key:'tracking', label:'📊 Tracking'   },
              ].map(({ key, label }) => (
                <button key={key} className={`phase-btn ${phase === key ? 'active' : ''}`} onClick={() => setPhase(key)}>
                  {label}
                </button>
              ))}
            </div>
            <label className="form-label">Picks Lock Date / Time</label>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input type="datetime-local" className="form-input" value={lockInput} onChange={e => setLockInput(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={saveLockTime}>Save</button>
            </div>
            {lockTime && (
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:12 }}>
                Locks: {new Date(lockTime).toLocaleString()}
              </div>
            )}
            <button className="btn btn-danger btn-sm" onClick={clearAll}>🗑 Clear All Data</button>
          </div>
        </div>

        {/* CSV Upload */}
        <div className="card">
          <div className="card-header"><span className="card-title">Load Schedule</span></div>
          <div className="card-body">
            <div className="upload-zone">
              <input type="file" accept=".csv" ref={fileRef} onChange={handleCSV} />
              <div className="upload-icon">📂</div>
              <div className="upload-label">Upload Bowl Schedule CSV</div>
              <div className="upload-hint">
                Date, Game, Team1, Spread1, Team2, Spread2, CFP, FirstPicker<br />
                12/19, Gasparilla Bowl, Memphis, +5.5, NC State, -5.5, no, Don<br />
                12/20, CFP First Round, Alabama, -1.5, Oklahoma, +1.5, yes, Bill
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Add */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header"><span className="card-title">Add Game Manually</span></div>
        <div className="card-body">
          <div className="admin-manual-grid">
            {[
              { label:'Bowl Name', key:'name',    placeholder:'Gasparilla Bowl' },
              { label:'Date',      key:'date',    placeholder:'12/19' },
              { label:'Team 1',    key:'team1',   placeholder:'Memphis' },
              { label:'Spread 1',  key:'spread1', placeholder:'+5.5' },
              { label:'Team 2',    key:'team2',   placeholder:'NC State' },
              { label:'Spread 2',  key:'spread2', placeholder:'-5.5' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="form-label">{label}</label>
                <input className="form-input" placeholder={placeholder} value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="form-label">CFP Game?</label>
              <select className="form-select" value={form.isCFP ? 'yes' : 'no'}
                onChange={e => setForm(f => ({ ...f, isCFP: e.target.value === 'yes' }))}>
                <option value="no">No — Regular Bowl</option>
                <option value="yes">Yes — CFP (2×)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Who Picks?</label>
              <select className="form-select" value={form.firstPicker}
                onChange={e => setForm(f => ({ ...f, firstPicker: e.target.value }))}>
                <option value="Bill">Bill</option>
                <option value="Don">Don</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={!form.name || !form.team1 || !form.team2}>
            + Add Game
          </button>
        </div>
      </div>

      {/* ── RESULTS ENTRY ── */}
      {games.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Mark Results</span>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>
              {settledCount} / {games.length} settled
            </span>
          </div>
          <div className="card-body" style={{ padding:0 }}>

            {/* Unsettled games — prominent entry UI */}
            {unsettledGames.length > 0 && (
              <div style={{ padding:'12px 16px', borderBottom: settledGames.length ? '1px solid var(--navy-border)' : 'none' }}>
                <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:1, color:'var(--text-muted)', marginBottom:10 }}>
                  Pending Results
                </div>
                {unsettledGames.map(game => {
                  return (
                    <div key={game.id} style={{
                      display:'grid', gridTemplateColumns:'90px 1fr auto 28px',
                      gap:10, alignItems:'center', padding:'8px 0',
                      borderBottom:'1px solid var(--navy-border)',
                    }}>
                      {/* Date + name */}
                      <div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{game.date}</div>
                        {game.isCFP && <span className="badge badge-cfp" style={{ marginTop:2 }}>CFP 2×</span>}
                      </div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{game.name}</div>

                      {/* Winner buttons */}
                      <div style={{ display:'flex', gap:6 }}>
                        <button
                          onClick={() => setResult(game.id, 'bill')}
                          style={{
                            background:'var(--bill-bg)', border:'1px solid var(--blue)',
                            borderRadius:'var(--radius-sm)', padding:'7px 20px',
                            cursor:'pointer', fontSize:13, fontWeight:700,
                            color:'var(--bill)', transition:'all 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(37,99,235,0.25)'}
                          onMouseLeave={e => e.currentTarget.style.background='var(--bill-bg)'}
                        >
                          Bill
                        </button>
                        <button
                          onClick={() => setResult(game.id, 'don')}
                          style={{
                            background:'var(--don-bg)', border:'1px solid var(--red)',
                            borderRadius:'var(--radius-sm)', padding:'7px 20px',
                            cursor:'pointer', fontSize:13, fontWeight:700,
                            color:'var(--don)', transition:'all 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(248,113,113,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background='var(--don-bg)'}
                        >
                          Don
                        </button>

                      </div>

                      {/* Remove */}
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(game.id)} title="Remove">−</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Settled games — compact list with ability to undo */}
            {settledGames.length > 0 && (
              <div style={{ padding:'12px 16px' }}>
                <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:1, color:'var(--text-muted)', marginBottom:10 }}>
                  Settled Games
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Game</th>
                      <th>Winner</th>
                      <th style={{ color:'var(--bill)' }}>Bill</th>
                      <th style={{ color:'var(--don)' }}>Don</th>
                      <th>Change</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {settledGames.map(game => {
                      const result = results[game.id];
                      const { billDelta, donDelta } = calcGameResult(game, result);
                      return (
                        <tr key={game.id} className={game.isCFP ? 'cfp-row' : ''}>
                          <td style={{ fontSize:12, color:'var(--text-muted)' }}>{game.date}</td>
                          <td>
                            <span style={{ fontWeight:600 }}>{game.name}</span>
                            {game.isCFP && <span className="badge badge-cfp" style={{ marginLeft:6 }}>CFP</span>}
                          </td>
                          <td>
                            {result === 'bill' && <span className="result-chip bill-win">✓ Bill</span>}
                            {result === 'don'  && <span className="result-chip don-win">✓ Don</span>}
                            {result === 'push' && <span className="result-chip push">Push</span>}
                          </td>
                          <td style={{ fontWeight:600, fontSize:13, color: billDelta >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {formatMoney(billDelta)}
                          </td>
                          <td style={{ fontWeight:600, fontSize:13, color: donDelta >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {formatMoney(donDelta)}
                          </td>
                          <td>
                            <div className="winner-btn-group">
                              <button className={`winner-btn bill-w ${result === 'bill' ? 'active' : ''}`} onClick={() => setResult(game.id, 'bill')}>B</button>
                              <button className={`winner-btn don-w  ${result === 'don'  ? 'active' : ''}`} onClick={() => setResult(game.id, 'don')}>D</button>

                            </div>
                          </td>
                          <td>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(game.id)} title="Remove">−</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {games.length > 0 && unsettledGames.length === 0 && settledGames.length === 0 && (
              <div style={{ padding:24, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No games loaded</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
