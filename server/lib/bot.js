

const { cloneBoard, applyMove, checkWin, ROWS, COLS } = require('./rules');

const COLUMN_ORDER = [3,2,4,1,5,0,6];


function isWinningMove(board, column, token) {
  try {
    const b = cloneBoard(board);
    const { row } = applyMove(b, column, token);
    const res = checkWin(b, token);
    return res.win;
  } catch (e) {
    return false; 
  }
}


function countPotentialThrees(board, row, column, token) {
  
  const b = cloneBoard(board);
  b[row][column] = token;
  let score = 0;

  const directions = [
    { dr: 0, dc: 1 }, // horiz
    { dr: 1, dc: 0 }, // vert
    { dr: 1, dc: 1 }, // diag down-right
    { dr: -1, dc: 1 } // diag up-right
  ];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const d of directions) {
        let tokens = 0, empties = 0;
        for (let k = 0; k < 4; k++) {
          const nr = r + d.dr * k;
          const nc = c + d.dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { tokens = -99; break; }
          if (b[nr][nc] === token) tokens++;
          else if (b[nr][nc] === 0) empties++;
        }
        if (tokens === 3 && empties === 1) score++;
      }
    }
  }
  return score;
}


function chooseMove(board, botToken = 2, oppToken = 1) {
  
  for (const col of COLUMN_ORDER) {
    if (isWinningMove(board, col, botToken)) {
      return col;
    }
  }

  
  for (const col of COLUMN_ORDER) {
    if (isWinningMove(board, col, oppToken)) {
      
      try {
        const b = cloneBoard(board);
        applyMove(b, col, botToken); 
        return col; 
      } catch (e) {
        continue;
      }
    }
  }

  
  let bestCol = null;
  let bestScore = -1;
  for (const col of COLUMN_ORDER) {
    try {
      const b = cloneBoard(board);
      const { row } = applyMove(b, col, botToken); 
      const score = countPotentialThrees(board, row, col, botToken);
      
      if (score > bestScore) {
        bestScore = score;
        bestCol = col;
      }
    } catch (e) {
      
      continue;
    }
  }

  if (bestCol !== null) return bestCol;

  
  for (const col of COLUMN_ORDER) {
    try {
      const b = cloneBoard(board);
      applyMove(b, col, botToken);
      return col;
    } catch (e) {
      continue;
    }
  }

  
  return -1;
}

module.exports = {
  chooseMove
};
