// Import the Stockfish engine (you may need to install a library like stockfish.js)
import { Stockfish } from 'stockfish.js'; // Ensure this library is available in your project

class StockfishBot {
    private engine: Stockfish;
    private difficultyLevel: number;

    constructor() {
        this.engine = Stockfish();
        this.difficultyLevel = 1; // Default difficulty
        this.initializeEngine();
    }

    private initializeEngine() {
        this.engine.postMessage("uci"); // Initialize the engine
    }

    public setDifficulty(level: number) {
        if (level < 1 || level > 10) {
            throw new Error("Difficulty level must be between 1 and 10.");
        }
        this.difficultyLevel = level;
        this.engine.postMessage(`setoption name Skill Level value ${this.difficultyLevel}`);
    }

    public getBestMove(fen: string): Promise<string> {
        return new Promise((resolve) => {
            this.engine.postMessage(`position fen ${fen}`);
            this.engine.postMessage("go depth 10");
            this.engine.onmessage = (message) => {
                if (message.includes("bestmove")) {
                    const bestMove = message.split(" ")[1];
                    resolve(bestMove);
                }
            };
        });
    }

    public getEvaluation(fen: string): Promise<string> {
        return new Promise((resolve) => {
            this.engine.postMessage(`position fen ${fen}`);
            this.engine.postMessage("go depth 5");
            this.engine.onmessage = (message) => {
                if (message.includes("info")) {
                    const evaluation = message.match(/score cp (-?\d+)/);
                    if (evaluation) {
                        resolve(evaluation[1]);
                    }
                }
            };
        });
    }
}

export default StockfishBot;