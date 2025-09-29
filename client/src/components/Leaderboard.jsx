import React, { useEffect, useState } from 'react';

export default function Leaderboard() {
  const [board, setBoard] = useState([]);

  useEffect(() => {
    fetch('https://connect-four-van4.onrender.com/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setBoard(data.leaderboard);
        }
      })
      .catch(e => console.error("Error fetching leaderboard:", e));
  }, []);

  return (
    <div className="leaderboard">
      <h4>Leaderboard (Top wins)</h4>
      {board.length === 0 ? (
        <p>No data yet</p>
      ) : (
        <ol>
          {board.map((p, idx) => (
            <li key={idx}>
              {p.username} — {p.wins} wins
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
