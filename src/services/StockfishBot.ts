class StockfishBot {
  private engine: any;
  private difficultyLevel: number = 1;
  private isReady: boolean = false;
  private bestMoveCallback: ((move: number[]) => void) | null = null;

  constructor() {
    this.initializeEngine();
  }

  private initializeEngine() {
    try {
      const Stockfish = require('stockfish');
      this.engine = Stockfish();
      
      this.engine.onmessage = (message: string) => {
        if (message.includes('uciok')) {
          this.isReady = true;
          this.engine.postMessage(`setoption name Skill Level value ${this.difficultyLevel}`);
        }
        
        if (message.includes('bestmove')) {
          this.processBestMove(message);
        }
      };

      this.engine.postMessage('uci');
    } catch (error) {
      console.error('Stockfish initialization failed:', error);
    }
  }

  private processBestMove(message: string) {
    const parts = message.split(' ');
    const moveStr = parts[1];

    if (moveStr && moveStr.length >= 4 && this.bestMoveCallback) {
      try {
        const fromFile = moveStr.charCodeAt(0) - 'a'.charCodeAt(0);
        const fromRank = 8 - parseInt(moveStr[1]);
        const toFile = moveStr.charCodeAt(2) - 'a'.charCodeAt(0);
        const toRank = 8 - parseInt(moveStr[3]);

        this.bestMoveCallback([fromRank, fromFile, toRank, toFile]);
        this.bestMoveCallback = null;
      } catch (error) {
        console.error('Error parsing move:', error);
      }
    }
  }

  public setDifficulty(level: number) {
    if (level < 1 || level > 10) {
      throw new Error('Difficulty level must be between 1 and 10.');
    }
    this.difficultyLevel = level;

    if (this.isReady && this.engine) {
      this.engine.postMessage(`setoption name Skill Level value ${level - 1}`);
    }
  }

  public getBestMove(fen: string): Promise<number[]> {
    return new Promise((resolve) => {
      if (!this.isReady || !this.engine) {
        console.warn('Engine not ready');
        resolve([]);
        return;
      }

      this.bestMoveCallback = resolve;

      try {
        this.engine.postMessage(`position fen ${fen}`);
        this.engine.postMessage('go depth 15');
      } catch (error) {
        console.error('Error sending position to engine:', error);
        resolve([]);
      }
    });
  }

  public getEvaluation(fen: string): Promise<number> {
    return new Promise((resolve) => {
      if (!this.isReady || !this.engine) {
        resolve(0);
        return;
      }

      let evaluation = 0;
      const originalCallback = this.engine.onmessage;

      this.engine.onmessage = (message: string) => {
        if (message.includes('info') && message.includes('score')) {
          const scoreMatch = message.match(/score cp (-?\d+)/);
          if (scoreMatch) {
            evaluation = parseInt(scoreMatch[1]);
          }
        }

        if (message.includes('bestmove')) {
          resolve(evaluation);
          this.engine.onmessage = originalCallback;
        }
      };

      try {
        this.engine.postMessage(`position fen ${fen}`);
        this.engine.postMessage('go depth 10');
      } catch (error) {
        console.error('Error getting evaluation:', error);
        resolve(0);
      }
    });
  }

  public setSearchDepth(depth: number) {
    if (depth < 1 || depth > 30) {
      throw new Error('Depth must be between 1 and 30.');
    }
  }

  public terminate() {
    if (this.engine) {
      this.engine.postMessage('quit');
    }
  }
}

export default StockfishBot;
