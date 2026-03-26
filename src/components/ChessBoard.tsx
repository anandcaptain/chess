import React, { useState, useEffect } from 'react';
import StockfishBot from '../services/StockfishBot';

interface Position {
  row: number;
  col: number;
}

const ChessBoard: React.FC = () => {
  const [board, setBoard] = useState<string[][]>([
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ]);

  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [stockfish] = useState(() => new StockfishBot());
  const [isAIThinking, setIsAIThinking] = useState(false);

  const SQUARE_SIZE = 80;

  const drawPiece = (piece: string, x: number, y: number) => {
    const size = SQUARE_SIZE * 0.7;
    const offset = SQUARE_SIZE * 0.15;

    const pieces: { [key: string]: JSX.Element } = {
      'P': <WhitePawn x={x + offset} y={y + offset} size={size} />,
      'N': <WhiteKnight x={x + offset} y={y + offset} size={size} />,
      'B': <WhiteBishop x={x + offset} y={y + offset} size={size} />,
      'R': <WhiteRook x={x + offset} y={y + offset} size={size} />,
      'Q': <WhiteQueen x={x + offset} y={y + offset} size={size} />,
      'K': <WhiteKing x={x + offset} y={y + offset} size={size} />,
      'p': <BlackPawn x={x + offset} y={y + offset} size={size} />,
      'n': <BlackKnight x={x + offset} y={y + offset} size={size} />,
      'b': <BlackBishop x={x + offset} y={y + offset} size={size} />,
      'r': <BlackRook x={x + offset} y={y + offset} size={size} />,
      'q': <BlackQueen x={x + offset} y={y + offset} size={size} />,
      'k': <BlackKing x={x + offset} y={y + offset} size={size} />
    };

    return pieces[piece] || null;
  };

  const calculateValidMoves = (row: number, col: number) => {
    const piece = board[row][col];
    if (piece === '.') return [];

    const moves: Position[] = [];
    const pieceLower = piece.toLowerCase();
    const isWhite = piece === piece.toUpperCase();

    const addMove = (r: number, c: number) => {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = board[r][c];
        if (target === '.' || (isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase())) {
          moves.push({ row: r, col: c });
        }
      }
    };

    if (pieceLower === 'p') {
      const direction = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;
      const newRow = row + direction;

      if (newRow >= 0 && newRow < 8 && board[newRow][col] === '.') {
        moves.push({ row: newRow, col });
        if (row === startRow && board[newRow + direction] && board[newRow + direction][col] === '.') {
          moves.push({ row: newRow + direction, col });
        }
      }

      if (newRow >= 0 && newRow < 8) {
        if (col - 1 >= 0 && board[newRow][col - 1] !== '.' && 
            ((isWhite && board[newRow][col - 1] === board[newRow][col - 1].toLowerCase()) ||
             (!isWhite && board[newRow][col - 1] === board[newRow][col - 1].toUpperCase()))) {
          moves.push({ row: newRow, col: col - 1 });
        }
        if (col + 1 < 8 && board[newRow][col + 1] !== '.' &&
            ((isWhite && board[newRow][col + 1] === board[newRow][col + 1].toLowerCase()) ||
             (!isWhite && board[newRow][col + 1] === board[newRow][col + 1].toUpperCase()))) {
          moves.push({ row: newRow, col: col + 1 });
        }
      }
    }

    if (pieceLower === 'n') {
      const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      knightMoves.forEach(([dr, dc]) => addMove(row + dr, col + dc));
    }

    if (['b', 'r', 'q'].includes(pieceLower)) {
      const directions = [];
      if (['r', 'q'].includes(pieceLower)) directions.push([0, 1], [0, -1], [1, 0], [-1, 0]);
      if (['b', 'q'].includes(pieceLower)) directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);

      directions.forEach(([dr, dc]) => {
        for (let i = 1; i < 8; i++) {
          const newRow = row + dr * i;
          const newCol = col + dc * i;
          if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;

          const target = board[newRow][newCol];
          if (target === '.') {
            moves.push({ row: newRow, col: newCol });
          } else {
            if ((isWhite && target === target.toLowerCase()) || (!isWhite && target === target.toUpperCase())) {
              moves.push({ row: newRow, col: newCol });
            }
            break;
          }
        }
      });
    }

    if (pieceLower === 'k') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          addMove(row + dr, col + dc);
        }
      }
    }

    return moves;
  };

  const boardToFen = (): string => {
    let fen = '';
    for (let row = 0; row < 8; row++) {
      let emptyCount = 0;
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece === '.') {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          fen += piece;
        }
      }
      if (emptyCount > 0) fen += emptyCount;
      if (row < 7) fen += '/';
    }
    return fen + ' b KQkq - 0 1';
  };

  const handleSquareClick = async (row: number, col: number) => {
    if (isAIThinking) return;

    if (selectedSquare) {
      const isValidMove = validMoves.some(m => m.row === row && m.col === col);

      if (isValidMove) {
        const newBoard = board.map(r => [...r]);
        const piece = newBoard[selectedSquare.row][selectedSquare.col];
        newBoard[selectedSquare.row][selectedSquare.col] = '.';
        newBoard[row][col] = piece;
        setBoard(newBoard);
        setSelectedSquare(null);
        setValidMoves([]);

        // AI move
        setIsAIThinking(true);
        try {
          const fen = boardToFen();
          const aiMove = await stockfish.getBestMove(fen);
          if (aiMove) {
            const [fromRow, fromCol, toRow, toCol] = aiMove;
            const aiBoard = newBoard.map(r => [...r]);
            const aiPiece = aiBoard[fromRow][fromCol];
            aiBoard[fromRow][fromCol] = '.';
            aiBoard[toRow][toCol] = aiPiece;
            setBoard(aiBoard);
          }
        } catch (error) {
          console.error('AI move error:', error);
        }
        setIsAIThinking(false);
      } else if (board[row][col] !== '.') {
        setSelectedSquare({ row, col });
        setValidMoves(calculateValidMoves(row, col));
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else if (board[row][col] !== '.') {
      setSelectedSquare({ row, col });
      setValidMoves(calculateValidMoves(row, col));
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Chess Game</h1>
      {isAIThinking && <p>AI is thinking...</p>}
      <svg width={SQUARE_SIZE * 8} height={SQUARE_SIZE * 8} style={{ border: '2px solid #333' }}>
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const x = colIndex * SQUARE_SIZE;
            const y = rowIndex * SQUARE_SIZE;
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
            const isValidMove = validMoves.some(m => m.row === rowIndex && m.col === colIndex);

            return (
              <g key={`${rowIndex}-${colIndex}`} onClick={() => handleSquareClick(rowIndex, colIndex)}>
                <rect
                  x={x}
                  y={y}
                  width={SQUARE_SIZE}
                  height={SQUARE_SIZE}
                  fill={isSelected ? '#baca44' : isValidMove ? '#a6e3a1' : isLight ? '#f0d9b5' : '#b58863'}
                  style={{ cursor: 'pointer' }}
                />
                {drawPiece(piece, x, y)}
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
};

// SVG Piece Components
const WhitePawn: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g>
    <circle cx={x + size / 2} cy={y + size * 0.3} r={size * 0.2} fill="white" stroke="black" strokeWidth="2" />
    <rect x={x + size * 0.3} y={y + size * 0.5} width={size * 0.4} height={size * 0.4} fill="white" stroke="black" strokeWidth="2" />
  </g>
);

const WhiteKnight: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g>
    <path d={`M ${x + size * 0.5} ${y + size * 0.2} L ${x + size * 0.7} ${y + size * 0.4} L ${x + size * 0.6} ${y + size * 0.7} L ${x + size * 0.4} ${y + size * 0.8} L ${x + size * 0.3} ${y + size * 0.6} Z`} fill="white" stroke="black" strokeWidth="2" />
  </g>
);

const WhiteBishop: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g>
    <circle cx={x + size / 2} cy={y + size * 0.25} r={size * 0.15} fill="white" stroke="black" strokeWidth="2" />
    <path d={`M ${x + size * 0.35} ${y + size * 0.4} L ${x + size * 0.65} ${y + size * 0.4} L ${x + size * 0.7} ${y + size * 0.8} L ${x + size * 0.3} ${y + size * 0.8} Z`} fill="white" stroke="black" strokeWidth="2" />
  </g>
);

const WhiteRook: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g>
    <path d={`M ${x + size * 0.3} ${y + size * 0.2} L ${x + size * 0.4} ${y + size * 0.2} L ${x + size * 0.4} ${y + size * 0.3} L ${x + size * 0.6} ${y + size * 0.3} L ${x + size * 0.6} ${y + size * 0.2} L ${x + size * 0.7} ${y + size * 0.2} L ${x + size * 0.7} ${y + size * 0.8} L ${x + size * 0.3} ${y + size * 0.8} Z`} fill="white" stroke="black" strokeWidth="2" />
  </g>
);

const WhiteQueen: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g>
    <circle cx={x + size * 0.5} cy={y + size * 0.25} r={size * 0.12} fill="white" stroke="black" strokeWidth="2" />
    <circle cx={x + size * 0.35} cy={y + size * 0.2} r={size * 0.08} fill="white" stroke="black" strokeWidth="2" />
    <circle cx={x + size * 0.65} cy={y + size * 0.2} r={size * 0.08} fill="white" stroke="black" strokeWidth="2" />
    <path d={`M ${x + size * 0.3} ${y + size * 0.35} L ${x + size * 0.7} ${y + size * 0.35} L ${x + size * 0.75} ${y + size * 0.8} L ${x + size * 0.25} ${y + size * 0.8} Z`} fill="white" stroke="black" strokeWidth="2" />
  </g>
);

const WhiteKing: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g>
    <line x1={x + size / 2} y1={y + size * 0.15} x2={x + size / 2} y2={y + size * 0.3} stroke="black" strokeWidth="2" />
    <line x1={x + size * 0.4} y1={y + size * 0.2} x2={x + size * 0.6} y2={y + size * 0.2} stroke="black" strokeWidth="2" />
    <circle cx={x + size / 2} cy={y + size * 0.35} r={size * 0.15} fill="white" stroke="black" strokeWidth="2" />
    <path d={`M ${x + size * 0.35} ${y + size * 0.5} L ${x + size * 0.65} ${y + size * 0.5} L ${x + size * 0.7} ${y + size * 0.8} L ${x + size * 0.3} ${y + size * 0.8} Z`} fill="white" stroke="black" strokeWidth="2" />
  </g>
);

const BlackPawn: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g>
    <circle cx={x + size / 2} cy={y + size * 0.3} r={size * 0.2} fill="black" stroke="black" strokeWidth="2" />
    <rect x={x + size * 0.3} y={y + size * 0.5} width={size * 0.4} height={size * 0.4} fill="black" stroke="black" strokeWidth="2" />
  </g>
);

const BlackKnight: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g>
    <path d={`M ${x + size * 0.5} ${y + size * 0.2} L ${x + size * 0.7} ${y + size * 0.4} L ${x + size * 0.6} ${y + size * 0.7} L ${x + size * 0.4} ${y + size * 0.8} L ${x + size * 0.3} ${y + size * 0.6} Z`} fill="black" stroke="black" strokeWidth="2" />
  </g>
);

const BlackBishop: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g>
    <circle cx={x + size / 2} cy={y + size * 0.25} r={size * 0.15} fill="black" stroke="black" strokeWidth="2" />
    <path d={`M ${x + size * 0.35} ${y + size * 0.4} L ${x + size * 0.65} ${y + size * 0.4} L ${x + size * 0.7} ${y + size * 0.8} L ${x + size * 0.3} ${y + size * 0.8} Z`} fill="black" stroke="black" strokeWidth="2" />
  </g>
);

const BlackRook: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g>
    <path d={`M ${x + size * 0.3} ${y + size * 0.2} L ${x + size * 0.4} ${y + size * 0.2} L ${x + size * 0.4} ${y + size * 0.3} L ${x + size * 0.6} ${y + size * 0.3} L ${x + size * 0.6} ${y + size * 0.2} L ${x + size * 0.7} ${y + size * 0.2} L ${x + size * 0.7} ${y + size * 0.8} L ${x + size * 0.3} ${y + size * 0.8} Z`} fill="black" stroke="black" strokeWidth="2" />
  </g>
);

const BlackQueen: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g>
    <circle cx={x + size * 0.5} cy={y + size * 0.25} r={size * 0.12} fill="black" stroke="black" strokeWidth="2" />
    <circle cx={x + size * 0.35} cy={y + size * 0.2} r={size * 0.08} fill="black" stroke="black" strokeWidth="2" />
    <circle cx={x + size * 0.65} cy={y + size * 0.2} r={size * 0.08} fill="black" stroke="black" strokeWidth="2" />
    <path d={`M ${x + size * 0.3} ${y + size * 0.35} L ${x + size * 0.7} ${y + size * 0.35} L ${x + size * 0.75} ${y + size * 0.8} L ${x + size * 0.25} ${y + size * 0.8} Z`} fill="black" stroke="black" strokeWidth="2" />
  </g>
);

const BlackKing: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => (
  <g>
    <line x1={x + size / 2} y1={y + size * 0.15} x2={x + size / 2} y2={y + size * 0.3} stroke="black" strokeWidth="2" />
    <line x1={x + size * 0.4} y1={y + size * 0.2} x2={x + size * 0.6} y2={y + size * 0.2} stroke="black" strokeWidth="2" />
    <circle cx={x + size / 2} cy={y + size * 0.35} r={size * 0.15} fill="black" stroke="black" strokeWidth="2" />
    <path d={`M ${x + size * 0.35} ${y + size * 0.5} L ${x + size * 0.65} ${y + size * 0.5} L ${x + size * 0.7} ${y + size * 0.8} L ${x + size * 0.3} ${y + size * 0.8} Z`} fill="black" stroke="black" strokeWidth="2" />
  </g>
);

export default ChessBoard;
