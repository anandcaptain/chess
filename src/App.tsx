import React, { useState, useEffect } from 'react';

// ============= TYPES =============
interface Player {
  id: string;
  name: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
}

interface GameState {
  id: string;
  player1: string;
  player2: string;
  moves: string[];
  status: 'pending' | 'active' | 'completed';
  winner?: string;
  createdAt: Date;
}

interface Message {
  player: string;
  text: string;
  timestamp: Date;
}

interface Move {
  from: string;
  to: string;
  piece: string;
}

// ============ SERVICES ============
class AuthService {
  private token: string | null = localStorage.getItem('authToken');

  login(email: string, password: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const token = 'mock-token-' + Date.now();
        localStorage.setItem('authToken', token);
        this.token = token;
        resolve(token);
      }, 1000);
    });
  }

  logout() {
    localStorage.removeItem('authToken');
    this.token = null;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

class NotificationService {
  private listeners: ((notification: any) => void)[] = [];

  subscribe(callback: (notification: any) => void) {
    this.listeners.push(callback);
  }

  notify(message: string, type: 'info' | 'success' | 'error' | 'warning') {
    const notification = { message, type, id: Date.now() };
    this.listeners.forEach(listener => listener(notification));
  }

  success(message: string) {
    this.notify(message, 'success');
  }

  error(message: string) {
    this.notify(message, 'error');
  }

  info(message: string) {
    this.notify(message, 'info');
  }
}

class GameStateManager {
  private gameState: GameState = {
    id: '',
    player1: '',
    player2: '',
    moves: [],
    status: 'pending',
    createdAt: new Date(),
  };

  getGameState() {
    return this.gameState;
  }

  addMove(move: string) {
    this.gameState.moves.push(move);
  }

  resetGame() {
    this.gameState = {
      id: '',
      player1: '',
      player2: '',
      moves: [],
      status: 'pending',
      createdAt: new Date(),
    };
  }

  endGame(status: string, winner?: string) {
    this.gameState.status = 'completed';
    this.gameState.winner = winner;
  }

  setPlayers(player1: string, player2: string) {
    this.gameState.player1 = player1;
    this.gameState.player2 = player2;
  }
}

class SocketService {
  private socket: WebSocket | null = null;
  private listeners: { [key: string]: ((data: any) => void)[] } = {};

  connect(url: string) {
    this.socket = new WebSocket(url);
    this.socket.onopen = () => console.log('Connected to WebSocket');
    this.socket.onclose = () => console.log('Disconnected from WebSocket');
    this.socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (this.listeners[data.type]) {
        this.listeners[data.type].forEach(cb => cb(data));
      }
    };
  }

  send(message: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

// Singleton instances
const authService = new AuthService();
const notificationService = new NotificationService();
const gameStateManager = new GameStateManager();
const socketService = new SocketService();

// ============= COMPONENTS =============
const GameChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [playerName] = useState('Player1');

  const sendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, {
        player: playerName,
        text: input,
        timestamp: new Date()
      }]);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-96 w-80 bg-gray-900 rounded-lg border border-gray-700 shadow-lg">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 rounded-t-lg">
        <h3 className="text-white font-bold">Game Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className="bg-gray-800 p-2 rounded text-sm">
            <p className="text-blue-400 font-semibold">{msg.player}</p>
            <p className="text-white">{msg.text}</p>
            <p className="text-gray-500 text-xs">{msg.timestamp.toLocaleTimeString()}</p>
          </div>
        ))}
      </div>

      <div className="flex p-3 gap-2 border-t border-gray-700 bg-gray-800 rounded-b-lg">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type message..."
          className="flex-1 bg-gray-700 text-white px-3 py-1 rounded text-sm focus:outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

const MoveHistory: React.FC = () => {
  const [moves, setMoves] = useState<string[]>([]);

  return (
    <div className="w-64 h-96 bg-gray-900 rounded-lg border border-gray-700 p-4">
      <h3 className="text-white font-bold mb-4">Move History</h3>
      <div className="overflow-y-auto h-full space-y-2">
        {moves.length === 0 ? (
          <p className="text-gray-500 text-sm">No moves yet</p>
        ) : (
          moves.map((move, idx) => (
            <div key={idx} className="text-white text-sm bg-gray-800 p-2 rounded">
              {idx + 1}. {move}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const GameTimer: React.FC<{ whiteTime: number; blackTime: number; isWhiteTurn: boolean }> = ({ whiteTime, blackTime, isWhiteTurn }) => {
  const [wTime, setWTime] = useState(whiteTime);
  const [bTime, setBTime] = useState(blackTime);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isWhiteTurn) {
        setWTime(t => t > 0 ? t - 1 : 0);
      } else {
        setBTime(t => t > 0 ? t - 1 : 0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isWhiteTurn]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex gap-8 justify-center my-4">
      <div className={`p-4 rounded-lg ${isWhiteTurn ? 'bg-white text-black' : 'bg-gray-400'}`}> 
        <p className="text-sm font-bold">White</p>
        <p className="text-2xl font-bold">{formatTime(wTime)}</p>
      </div>
      <div className={`p-4 rounded-lg ${!isWhiteTurn ? 'bg-gray-800 text-white' : 'bg-gray-600'}`}> 
        <p className="text-sm font-bold">Black</p>
        <p className="text-2xl font-bold">{formatTime(bTime)}</p>
      </div>
    </div>
  );
};

const PlayerProfile: React.FC<{ player: Player }> = ({ player }) => {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 w-64">
      <h2 className="text-white text-xl font-bold mb-4">{player.name}</h2>
      <div className="space-y-2 text-white">
        <p className="text-gray-400">ELO: <span className="text-yellow-400 font-bold">{player.elo}</span></p>
        <p className="text-gray-400">Wins: <span className="text-green-400 font-bold">{player.wins}</span></p>
        <p className="text-gray-400">Losses: <span className="text-red-400 font-bold">{player.losses}</span></p>
        <p className="text-gray-400">Draws: <span className="text-gray-300 font-bold">{player.draws}</span></p>
      </div>
    </div>
  );
};

const GameSettings: React.FC = () => {
  const [timeControl, setTimeControl] = useState('10');
  const [difficulty, setDifficulty] = useState('medium');
  const [soundEnabled, setSoundEnabled] = useState(true);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 w-80">
      <h2 className="text-white text-xl font-bold mb-4">Game Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="text-white text-sm">Time Control (minutes)</label>
          <input 
            type="number" 
            value={timeControl} 
            onChange={(e) => setTimeControl(e.target.value)}
            className="w-full bg-gray-800 text-white p-2 rounded mt-1"
          />
        </div>
        <div>
          <label className="text-white text-sm">AI Difficulty</label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full bg-gray-800 text-white p-2 rounded mt-1"
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-white text-sm">Sound</label>
          <input 
            type="checkbox" 
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="w-4 h-4"
          />
        </div>
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">
          Save Settings
        </button>
      </div>
    </div>
  );
};

const GameRoom: React.FC = () => {
  const [lobby, setLobby] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState<string>('');

  const joinLobby = () => {
    if (playerName) {
      setLobby(prevLobby => [...prevLobby, playerName]);
      setPlayerName('');
      notificationService.success(`${playerName} joined the lobby!`);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 w-80">
      <h2 className="text-white text-xl font-bold mb-4">Multiplayer Lobby</h2>
      <div className="space-y-3">
        <input 
          type="text" 
          value={playerName} 
          onChange={(e) => setPlayerName(e.target.value)} 
          placeholder="Enter your name" 
          className="w-full bg-gray-800 text-white p-2 rounded"
        />
        <button 
          onClick={joinLobby}
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
        >
          Join Lobby
        </button>
        <div className="mt-4">
          <h3 className="text-white font-bold mb-2">Players Online:</h3>
          <ul className="space-y-1">
            {lobby.map((player, index) => (
              <li key={index} className="text-gray-300 bg-gray-800 p-2 rounded text-sm">
                👤 {player}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// ============= MAIN APP =============
export default function App() {
  const [currentView, setCurrentView] = useState('menu');
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);

  const mockPlayer: Player = {
    id: '1',
    name: 'Player1',
    elo: 1850,
    wins: 45,
    losses: 15,
    draws: 8,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <h1 className="text-4xl font-bold text-white text-center mb-8">♟️ Chess Master</h1>

      <div className="flex justify-center gap-4 mb-8">
        <button 
          onClick={() => setCurrentView('menu')}
          className={`px-6 py-2 rounded ${currentView === 'menu' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Menu
        </button>
        <button 
          onClick={() => setCurrentView('game')}
          className={`px-6 py-2 rounded ${currentView === 'game' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Game
        </button>
        <button 
          onClick={() => setCurrentView('profile')}
          className={`px-6 py-2 rounded ${currentView === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Profile
        </button>
      </div>

      <div className="flex justify-center">
        {currentView === 'menu' && (
          <div className="space-y-6">
            <GameRoom />
            <GameSettings />
          </div>
        )}

        {currentView === 'game' && (
          <div className="space-y-6">
            <GameTimer whiteTime={whiteTime} blackTime={blackTime} isWhiteTurn={isWhiteTurn} />
            <div className="flex gap-8 justify-center flex-wrap">
              <GameChat />
              <MoveHistory />
            </div>
          </div>
        )}

        {currentView === 'profile' && (
          <PlayerProfile player={mockPlayer} />
        )}
      </div>
    </div>
  );
}