import React from 'react';

export default function GameBoard({ board, onDrop }) {
  if (!board) return null;

  const rows = board.length;
  const cols = board[0].length;

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        {Array.from({ length: cols }).map((_, c) => (
          <button key={c} onClick={() => onDrop(c)} style={{ width: 60, height: 30 }}>
            Drop {c}
          </button>
        ))}
      </div>
      <div className="board">
        {board.flatMap((row, rIdx) =>
          row.map((cell, cIdx) => {
            const classes = ['cell'];
            if (cell === 0) classes.push('empty');
            if (cell === 1) classes.push('player1');
            if (cell === 2) classes.push('player2');
            return <div key={`${rIdx}-${cIdx}`} className={classes.join(' ')}></div>;
          })
        )}
      </div>
    </div>
  );
}
