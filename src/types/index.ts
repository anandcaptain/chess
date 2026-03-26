// src/types/index.ts

// Define the GameState interface
interface GameState {
    currentTurn: Player;
    board: string[][];
    gameMode: GameMode;
    isGameOver: boolean;
}

// Define the Player interface
interface Player {
    id: string;
    name: string;
    color: 'white' | 'black';
}

// Define the GameSession interface
interface GameSession {
    id: string;
    players: Player[];
    state: GameState;
    createdAt: Date;
    updatedAt: Date;
}

// Define the PuzzleData interface
interface PuzzleData {
    position: string[][];
    solution: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

// Define the GameReview interface
interface GameReview {
    sessionId: string;
    ratings: number;
    comments: string;
}

// Define the BotMove interface
interface BotMove {
    playerId: string;
    move: string;
    timestamp: Date;
}

// Define the GameMode interface
interface GameMode {
    mode: 'standard' | 'blitz' | 'bullet';
    timeLimit?: number; // in seconds
}