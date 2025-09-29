const ROWS = 6;
const COLS = 7;

function createBoard() {
  const board = [];
  for (let r = 0; r < ROWS; r++) {
    board[r] = new Array(COLS).fill(0);
  }
  return board;
}

function cloneBoard(board) {
  return board.map(row => row.slice());
}

function applyMove(board, column, token) {
  if (column < 0 || column >= COLS) throw new Error('Invalid column');
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][column] === 0) {
      board[r][column] = token;
      return { board, row: r };
    }
  }
  throw new Error('Column full');
}

function checkWin(board, token) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      let ok = true, coords = [];
      for (let k = 0; k < 4; k++) {
        if (board[r][c + k] !== token) { ok = false; break; }
        coords.push([r, c + k]);
      }
      if (ok) return { win: true, coords };
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      let ok = true, coords = [];
      for (let k = 0; k < 4; k++) {
        if (board[r + k][c] !== token) { ok = false; break; }
        coords.push([r + k, c]);
      }
      if (ok) return { win: true, coords };
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      let ok = true, coords = [];
      for (let k = 0; k < 4; k++) {
        if (board[r + k][c + k] !== token) { ok = false; break; }
        coords.push([r + k, c + k]);
      }
      if (ok) return { win: true, coords };
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      let ok = true, coords = [];
      for (let k = 0; k < 4; k++) {
        if (board[r - k][c + k] !== token) { ok = false; break; }
        coords.push([r - k, c + k]);
      }
      if (ok) return { win: true, coords };
    }
  }
  return { win: false, coords: [] };
}

function checkDraw(board) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === 0) return false;
    }
  }
  return true;
}

module.exports = {
  ROWS, COLS,
  createBoard,
  applyMove,
  checkWin,
  checkDraw,
  cloneBoard
};
