import React from 'react';

interface GameMenuProps {
    onSelectMode: (mode: string) => void;
}

const GameMenu: React.FC<GameMenuProps> = ({ onSelectMode }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-purple-900">
            <h1 className="text-6xl font-bold text-white mb-12">Chess Master</h1>
            <div className="space-y-4">
                <button onClick={() => onSelectMode('pvp')} className="btn w-64 py-4 text-xl"> Player vs Player </button>
                <button onClick={() => onSelectMode('pvbot')} className="btn w-64 py-4 text-xl"> Player vs Bot </button>
                <button onClick={() => onSelectMode('puzzle')} className="btn w-64 py-4 text-xl"> Puzzle Mode </button>
            </div>
        </div>
    );
};

export default GameMenu;