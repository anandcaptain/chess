// src/services/ChessEngine.ts

// Import the chess.js library
import { Chess } from 'chess.js';

// ChessEngine class to encapsulate the chess logic
export class ChessEngine {
    private chess: Chess;

    constructor() {
        this.chess = new Chess();
    }

    // Method to reset the game
    public resetGame(): void {
        this.chess.clear();
    }

    // Method to make a move
    public makeMove(move: string): boolean {
        const result = this.chess.move(move);
        return result !== null;
    }

    // Method to get the current board position
    public getBoardPosition(): string {
        return this.chess.ascii();
    }

    // Method to check if the game is over
    public isGameOver(): boolean {
        return this.chess.game_over();
    }

    // Method to get the current game state
    public getGameState(): object {
        return this.chess.fen();
    }
}