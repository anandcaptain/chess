import React, { useState } from 'react';

const GameRoom: React.FC = () => {
    const [lobby, setLobby] = useState<string[]>([]);
    const [playerName, setPlayerName] = useState<string>('');

    const joinLobby = () => {
        if (playerName) {
            setLobby(prevLobby => [...prevLobby, playerName]);
            setPlayerName('');
        }
    };

    return (
        <div>
            <h2>Multiplayer Lobby</h2>
            <input 
                type="text" 
                value={playerName} 
                onChange={(e) => setPlayerName(e.target.value)} 
                placeholder="Enter your name" 
            />
            <button onClick={joinLobby}>Join Lobby</button>
            <h3>Players in Lobby:</h3>
            <ul>
                {lobby.map((player, index) => (
                    <li key={index}>{player}</li>
                ))}
            </ul>
        </div>
    );
};

export default GameRoom;