import React, { useEffect, useState, useRef } from 'react';
import socket from './socket';
import Join from './components/Join';
import GameBoard from './components/GameBoard';
import Leaderboard from './components/Leaderboard';

export default function App() {
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [board, setBoard] = useState(null);
  const [turnToken, setTurnToken] = useState(null);
  const [yourToken, setYourToken] = useState(null);
  const [moves, setMoves] = useState([]);
  const [messages, setMessages] = useState([]);
  const reconnectAttempt = useRef(false);

  useEffect(() => {
    // socket event listeners
    socket.on('waiting_for_opponent', (p) => {
      setWaiting(true);
      appendMessage(p.message || 'Waiting for opponent...');
    });

    socket.on('game_start', (payload) => {
      setWaiting(false);
      setGameId(payload.gameId);
      setBoard(payload.board);
      setYourToken(payload.yourToken);
      setJoined(true);
      appendMessage('Game started. Your token: ' + payload.yourToken);
    });

    socket.on('game_state', (s) => {
      setBoard(s.board);
      setTurnToken(s.turnToken);
      setMoves(s.moves || []);
    });

    socket.on('move_made', (data) => {
      setBoard(data.board);
      if (data.move) {
        setMoves(prev => [...prev, data.move]);
        appendMessage(`${data.move.player} played column ${data.move.column}`);
      }
      if (data.winner) {
        if (data.winner === 'draw') appendMessage('Game ended in a draw.');
        else appendMessage(`Winner: ${data.winner}`);
      }
      if (data.turnToken) setTurnToken(data.turnToken);
    });

    socket.on('player_disconnected', (info) => {
      appendMessage(info.message || `${info.username} disconnected`);
    });

    socket.on('player_rejoined', (info) => {
      appendMessage(`${info.username} rejoined the game`);
    });

    socket.on('rejoin_success', (payload) => {
      setGameId(payload.gameId);
      setBoard(payload.board);
      setMoves(payload.moves || []);
      setTurnToken(payload.turnToken);
      appendMessage('Rejoined game ' + payload.gameId);
    });

    socket.on('error_msg', (err) => {
      appendMessage('Error: ' + (err.message || JSON.stringify(err)));
    });

    return () => {
      socket.off('waiting_for_opponent');
      socket.off('game_start');
      socket.off('game_state');
      socket.off('move_made');
      socket.off('player_disconnected');
      socket.off('player_rejoined');
      socket.off('rejoin_success');
      socket.off('error_msg');
    };
  }, []);

  function appendMessage(m) {
    setMessages(prev => [m, ...prev].slice(0, 50));
  }

  function handleJoin(name) {
    setUsername(name);
    socket.emit('join_queue', { username: name });
    setWaiting(true);
  }

  function handleDrop(column) {
    if (!gameId) return;
    // optimistic UI disabled; send make_move
    socket.emit('make_move', { gameId, column });
  }

  function handleRejoin() {
    if (!username || !gameId) return;
    socket.emit('rejoin_game', { username, gameId });
  }

  return (
    <div className="app">
      <div className="header">
        <h2>Connect Four (4 in a Row)</h2>
        <div>
          <button onClick={() => window.location.reload()}>Refresh</button>
        </div>
      </div>

      <div className="container">
        <div className="left">
          {!joined ? (
            <Join onJoin={handleJoin} />
          ) : (
            <div>
              <h3>Game: {gameId}</h3>
              <div className="info">
                <strong>Your username:</strong> {username} <br />
                <strong>Your token:</strong> {yourToken} <br />
                <strong>Turn:</strong> {turnToken === yourToken ? 'Your turn' : 'Opponent turn'}
              </div>

              <GameBoard board={board || Array(6).fill(Array(7).fill(0))} onDrop={handleDrop} />

              <div className="info">
                <button onClick={handleRejoin}>Attempt Rejoin</button>
                <div className="waiting">{messages[0]}</div>
                <div style={{ marginTop: 12 }}>
                  <h4>Messages</h4>
                  <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    {messages.map((m, i) => <div key={i}>{m}</div>)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="right">
          <Leaderboard />
          <div style={{ marginTop: 12, background: '#fff', padding: 10, borderRadius: 8 }}>
            <h4>Quick Info</h4>
            <ul>
              <li>Matchmaking: waits 10s then bot joins</li>
              <li>Reconnect: 30s to rejoin</li>
            </ul>
            <h5>API examples</h5>
            <pre style={{ fontSize: 12 }}>
              GET /api/leaderboard
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
