import { useState, useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { TrophyIcon, RefreshIcon, LogOutIcon, CrownIcon, EyeIcon, CheckIcon } from './Icons';
import { checkBingoLines } from '../utils/botEngine';
import BotBoardModal from './BotBoardModal';
import Confetti from './Confetti';
import { playSfx } from '../utils/sfx';
import './GameOverModal.css';

// After this long without the host, a ready player may start the next round (the server enforces it too).
const HOST_AWAY_START_MS = 20 * 1000;

export default function GameOverModal() {
  const { gameOver, isCreator, replayGame, setNextReady, actualLeaveRoom, roomData, playerId, showNotif } = useGame();
  const [showBotBoard, setShowBotBoard] = useState(false);
  // Next round is sent once; the button waits for the answer so a second tap cannot follow.
  const [replayPending, setReplayPending] = useState(false);
  const [readyPending, setReadyPending] = useState(false);
  // Ticks once a second while the host is away, so the start-without-them option appears on time.
  const [now, setNow] = useState(() => Date.now());

  const handleNextRound = () => {
    if (replayPending) return;
    setReplayPending(true);
    replayGame((res) => {
      setReplayPending(false);
      if (res && !res.success && res.error) showNotif(res.error, 'error');
    });
  };

  // One sound when the result appears.
  useEffect(() => {
    if (!gameOver) return;
    const ws = gameOver.winners || [];
    const draw = Boolean(gameOver.draw) || ws.length > 1;
    const won = !draw && ws.some(w => w.id === playerId);
    playSfx(won ? 'win' : draw ? 'line' : 'lose');
  }, [gameOver, playerId]);

  const isBot = Boolean(roomData?.isBot);
  const botPlayer = roomData?.players?.find(p => p.id === 'bot-opponent');
  const botBoard = gameOver?.botBoard || botPlayer?.board || [];

  const allCalled = gameOver?.calledNumbers || roomData?.calledNumbers || [];
  const lastMove = gameOver?.lastCalledNumber ?? (allCalled.length > 0 ? allCalled[allCalled.length - 1] : null);

  const botMarkedCells = useMemo(() => {
    const set = new Set();
    (gameOver?.botMarkedCells || []).forEach(n => set.add(Number(n)));
    (botPlayer?.markedCells || []).forEach(n => set.add(Number(n)));
    allCalled.forEach(n => set.add(Number(n)));
    if (lastMove !== null && lastMove !== undefined) set.add(Number(lastMove));
    return Array.from(set);
  }, [gameOver?.botMarkedCells, botPlayer?.markedCells, allCalled, lastMove]);

  const botBingoLines = useMemo(() => {
    if (!botBoard || botBoard.length !== 5) return [];
    const recalc = checkBingoLines(botBoard, new Set(botMarkedCells));
    return Array.from(new Set([...(gameOver?.botBingoLines || []), ...recalc]));
  }, [gameOver?.botBingoLines, botBoard, botMarkedCells]);

  // Who is ready for the next round, and whether the host is here.
  const players = roomData?.players || [];
  const me = players.find(p => p.id === playerId) || null;
  const host = players.find(p => p.id === roomData?.creatorId) || null;
  const hostAway = !isBot && Boolean(host && host.connected === false);
  // The room frame carries the server's clock; the host's absence is measured against that, not
  // against this device's clock.
  const clockSkew = roomData?.serverNow && roomData?.receivedAt ? roomData.serverNow - roomData.receivedAt : 0;
  const hostAwayMs = hostAway && host.awaySince ? Math.max(0, now + clockSkew - host.awaySince) : 0;
  const hostAwayLong = hostAway && hostAwayMs >= HOST_AWAY_START_MS;
  const iAmReady = Boolean(me?.nextReady);

  useEffect(() => {
    if (!gameOver || !hostAway) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [gameOver, hostAway]);

  const handleToggleReady = () => {
    if (readyPending) return;
    const next = !iAmReady;
    setReadyPending(true);
    setNextReady(next, (res) => {
      setReadyPending(false);
      if (res && !res.success && res.error) showNotif(res.error, 'error');
    });
  };

  // Hooks above run on every render; only now is it safe to bail out.
  if (!gameOver) return null;

  const winners = gameOver.winners || [];
  const isDraw = Boolean(gameOver.draw) || winners.length > 1;
  const amIWinner = !isDraw && winners.some(w => w.id === playerId);
  const round = roomData?.currentGameIndex || 1;

  const title = isDraw ? 'Draw' : amIWinner ? 'You won' : isBot ? 'The bot won' : 'Round over';
  const subtitle = isDraw
    ? `${winners.map(w => w.name).join(' and ')} reached five lines on the same call.`
    : amIWinner
      ? `You reached five lines first in round ${round}.`
      : isBot
        ? `The bot reached five lines first in round ${round}.`
        : `${winners.map(w => w.name).join(' and ')} reached five lines first.`;

  // "Alpha ready, Bravo not yet, Charlie away"
  const readyList = !isBot && players.length > 0 && (
    <div className="ready-list" role="status" aria-live="polite">
      <span className="eyebrow">Next round</span>
      <p>
        {players.map((p, i) => {
          const state = p.connected === false ? 'away' : p.nextReady ? 'ready' : 'not yet';
          const cls = state === 'ready' ? 'is-ready' : state === 'away' ? 'is-away' : 'is-waiting';
          const who = p.id === playerId ? 'You' : p.name;
          return (
            <span key={p.id}>
              {i > 0 && ', '}
              <span className={`ready-item ${cls}`}>
                {who}{!isBot && p.id === roomData?.creatorId ? ' (host)' : ''} {state}
              </span>
            </span>
          );
        })}
      </p>
    </div>
  );

  const readyStatus = (
    <div className="waiting-host" role="status">
      <span className="waiting-dot" aria-hidden="true" />
      <span>Ready, waiting for the others</span>
      <button type="button" className="btn btn-sm btn-ghost" onClick={handleToggleReady} disabled={readyPending}>
        Cancel
      </button>
    </div>
  );

  return (
    <>
      {amIWinner && <Confetti />}
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
        <div className={`modal-content game-over-modal ${amIWinner ? 'is-winner' : ''}`}>
          <div className="game-over-badge">
            <TrophyIcon size={28} />
          </div>

          <div className="game-over-head">
            <h2 id="game-over-title">{title}</h2>
            <p>{subtitle}</p>
          </div>

          <div className="winners-list">
            <div className="winners-head">
              <span className="eyebrow">{isDraw ? 'Drawn between' : 'Winner'}</span>
              <span className="tag">Round {round}</span>
            </div>
            {winners.map(w => (
              <div key={w.id} className={`winner-row ${w.id === playerId ? 'is-you' : ''}`}>
                <TrophyIcon size={16} />
                <span className="winner-name">{w.name}</span>
                {w.id === playerId && <span className="tag tag-brass">You</span>}
                {!isBot && w.id === roomData?.creatorId && (
                  <span className="winner-host" title="Host"><CrownIcon size={12} /></span>
                )}
              </div>
            ))}
          </div>

          <div className="game-over-actions">
            {isBot ? (
              <>
                <button className="btn btn-primary" onClick={() => replayGame()} type="button">
                  <RefreshIcon size={16} />
                  <span>Next round</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setShowBotBoard(true)} type="button">
                  <EyeIcon size={16} />
                  <span>See the bot's card</span>
                </button>
                <button className="btn btn-ghost" onClick={() => actualLeaveRoom(true)} type="button">
                  <LogOutIcon size={15} />
                  <span>Leave</span>
                </button>
              </>
            ) : isCreator ? (
              <>
                {readyList}
                <p className="host-note">Everyone still in the room will join the next round. It also starts on its own once everyone is ready.</p>
                <button className="btn btn-primary" onClick={handleNextRound} disabled={replayPending} type="button">
                  <RefreshIcon size={16} />
                  <span>{replayPending ? 'Starting' : 'Next round'}</span>
                </button>
                {iAmReady ? readyStatus : (
                  <button className="btn btn-secondary" onClick={handleToggleReady} disabled={readyPending} type="button">
                    <CheckIcon size={16} />
                    <span>Ready for the next round</span>
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => actualLeaveRoom(true)} type="button">
                  <LogOutIcon size={15} />
                  <span>Close room and leave</span>
                </button>
              </>
            ) : (
              <>
                {readyList}
                {iAmReady ? readyStatus : (
                  <button className="btn btn-primary" onClick={handleToggleReady} disabled={readyPending} type="button">
                    <CheckIcon size={16} />
                    <span>Ready for the next round</span>
                  </button>
                )}
                {hostAway && !hostAwayLong && (
                  <p className="host-note">The host is away. Ready players can start without them after 20 seconds.</p>
                )}
                {hostAwayLong && !iAmReady && (
                  <p className="host-note">The host is away. Mark yourself ready to start without them.</p>
                )}
                {hostAwayLong && iAmReady && (
                  <button className="btn btn-primary host-away-start" onClick={handleNextRound} disabled={replayPending} type="button">
                    <RefreshIcon size={16} />
                    <span>{replayPending ? 'Starting' : 'Host is away. Start without them'}</span>
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => actualLeaveRoom(true)} type="button">
                  <LogOutIcon size={15} />
                  <span>Leave room</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showBotBoard && (
        <BotBoardModal
          board={botBoard}
          markedCells={botMarkedCells}
          bingoLines={botBingoLines}
          lastMove={lastMove}
          difficulty={roomData?.difficulty || 'pro'}
          onClose={() => setShowBotBoard(false)}
        />
      )}
    </>
  );
}
