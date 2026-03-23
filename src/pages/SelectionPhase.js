import React, { useState } from 'react';

// Each game is assigned to ONE picker (Bill or Don).
// The picker chooses which team they want — the other player gets the remaining team.
// Team1 = Don's team, Team2 = Bill's team (as set when schedule is loaded).
// The "FirstPicker" field on each game indicates whose pick it is.

function PicksView({ playerKey, games, picks, updateState, isLocked }) {
  const selClass = playerKey === 'bill' ? 'bill-sel' : 'don-sel';
  const myGames  = games.filter(g => g[`${playerKey}Picker`]);
  const pickedCount = myGames.filter(g => picks[g.id]?.[playerKey]).length;

  const handlePick = (gameId, team, spread) => {
    if (isLocked) return;
    updateState({
      picks: {
        ...picks,
        [gameId]: { ...picks[gameId], [playerKey]: team, [`${playerKey}Spread`]: spread }
      }
    });
  };

  return (
    <div>
      <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
        My picks: <span style={{ color:'var(--green)', fontWeight:700 }}>{pickedCount}</span> / {myGames.length}
        {!isLocked && pickedCount === myGames.length && myGames.length > 0 &&
          <span style={{ color:'var(--gold)', marginLeft:12, fontWeight:600 }}>✓ All picks in!</span>}
      </div>

      {games.map(game => {
        const isMine = game[`${playerKey}Picker`];
        const myPick = picks[game.id]?.[playerKey];

        return (
          <div key={game.id} className={`pick-row ${game.isCFP ? 'cfp-pick' : ''}`}>
            <div>
              <div className="pick-row-date">{game.date}</div>
              {game.isCFP && <span className="badge badge-cfp" style={{ marginTop:2 }}>CFP 2×</span>}
            </div>
            <div>
              <div className="pick-row-game">{game.name}</div>
              {!isMine && (
                <div className="pick-row-game-sub">
                  {playerKey === 'bill' ? "Don's pick" : "Bill's pick"} — you get the other team
                </div>
              )}
            </div>
            <div>
              {isMine ? (
                // This player picks — show both teams as options
                <div className="team-btn-pair">
                  {[
                    { team: game.team1, spread: game.spread1 },
                    { team: game.team2, spread: game.spread2 },
                  ].map(({ team, spread }) => (
                    <button
                      key={team}
                      className={`team-btn ${myPick === team ? selClass + ' selected' : ''}`}
                      onClick={() => handlePick(game.id, team, spread)}
                      disabled={isLocked}
                    >
                      <span className="team-btn-team">{team}</span>
                      <span className="team-btn-spread">{spread}</span>
                    </button>
                  ))}
                </div>
              ) : (
                // Other player's pick — show what they picked (or TBD)
                <div className="other-assigned">
                  {picks[game.id]?.[playerKey === 'bill' ? 'don' : 'bill']
                    ? <>Their pick: <strong style={{ color: playerKey === 'bill' ? 'var(--don)' : 'var(--bill)' }}>
                        {picks[game.id]?.[playerKey === 'bill' ? 'don' : 'bill']}
                      </strong> — you get the other team</>
                    : 'Waiting on their pick — you get the other team'
                  }
                </div>
              )}
            </div>
            <div className="pick-status">
              {isMine
                ? (myPick ? '✅' : isLocked ? '❌' : '⭕')
                : '—'
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SelectionPhase({ state, updateState }) {
  const { games, picks, phase, lockTime } = state;
  const [activePlayer, setActivePlayer] = useState('bill');
  const isLocked = phase === 'locked' || phase === 'tracking';

  if (!games || games.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text-muted)' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:6 }}>No Schedule Yet</div>
        <div style={{ fontSize:13 }}>Admin needs to upload the bowl schedule before picks can be made.</div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--text-muted)' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Picks Not Open Yet</div>
        <div style={{ fontSize:13 }}>The admin will open picks when the bowl schedule is finalized.</div>
      </div>
    );
  }

  const billGames  = games.filter(g => g.billPicker).length;
  const donGames   = games.filter(g => g.donPicker).length;
  const billPicked = games.filter(g => g.billPicker && picks[g.id]?.bill).length;
  const donPicked  = games.filter(g => g.donPicker  && picks[g.id]?.don).length;

  return (
    <div>
      <div className="picks-hero">
        <div>
          <div className="picks-hero-title">Make Your Picks</div>
          <div className="picks-hero-sub">
            You alternate picking games. The picker chooses their team — the other player gets what's left.
            {lockTime && !isLocked && (
              <span style={{ color:'var(--gold)', marginLeft:8 }}>
                Locks: {new Date(lockTime).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {isLocked && (
        <div className="locked-banner">
          <div className="locked-banner-title">🔒 Picks Locked</div>
          <div className="locked-banner-sub">No more changes — time to watch the games!</div>
        </div>
      )}

      <div className="picker-tabs">
        {[
          { key:'bill', label:'Bill', picked:billPicked, total:billGames },
          { key:'don',  label:'Don',  picked:donPicked,  total:donGames  },
        ].map(({ key, label, picked, total }) => (
          <div
            key={key}
            className={`picker-tab ${key}-tab ${activePlayer === key ? 'active' : ''}`}
            onClick={() => setActivePlayer(key)}
          >
            <div className="picker-tab-name">{label}</div>
            <div className="picker-tab-sub">{picked} / {total} picks made</div>
          </div>
        ))}
      </div>

      <PicksView
        playerKey={activePlayer}
        games={games}
        picks={picks}
        updateState={updateState}
        isLocked={isLocked}
      />
    </div>
  );
}
