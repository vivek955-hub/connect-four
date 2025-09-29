import React, { useState } from 'react';

export default function Join({ onJoin }) {
  const [username, setUsername] = useState('');
  return (
    <div>
      <h3>Join Game</h3>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" />
      <div>
        <button onClick={() => { if (username.trim()) onJoin(username.trim()); }}>Join Queue</button>
      </div>
    </div>
  );
}
