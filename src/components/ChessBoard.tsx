import React from 'react';

const ChessBoard: React.FC = () => {
    const size = 8;
    const squares = [];
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const isBlack = (row + col) % 2 === 1;
            squares.push(
                <div key={`${row}-${col}`} style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: isBlack ? 'black' : 'white',
                }} />
            );
        }
    }
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${size}, 1fr)`,
        }}>
            {squares}
        </div>
    );
};

export default ChessBoard;