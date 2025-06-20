"use client"

import React, { useState, useEffect, useCallback } from "react";
import {connectWallet , disconnectWallet , getWalletAddress , messageAR , dryrunResult} from "./arweaveUtils"

const pId = "YOUR_PROCESS_ID"; // Replace with your actual Process ID

// Tetris game constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 13;
const EMPTY_CELL = 0;

// Tetris pieces (tetrominoes)
const PIECES = {
  I: {
    shape: [
      [1, 1, 1, 1]
    ],
    color: 'bg-cyan-400'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 'bg-yellow-400'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: 'bg-purple-400'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: 'bg-green-400'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: 'bg-red-400'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: 'bg-blue-400'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: 'bg-orange-400'
  }
};

const PIECE_TYPES = Object.keys(PIECES);

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [gameBoard, setGameBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [dropTime, setDropTime] = useState(1000);

  // Initialize empty board
  const createEmptyBoard = () => {
    return Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(EMPTY_CELL));
  };

  // Generate random piece
  const generateRandomPiece = () => {
    const pieceType = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
    return {
      type: pieceType,
      shape: PIECES[pieceType].shape,
      color: PIECES[pieceType].color,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(PIECES[pieceType].shape[0].length / 2),
      y: 0
    };
  };

  // Rotate piece 90 degrees clockwise
  const rotatePiece = (piece) => {
    const rotated = piece.shape[0].map((_, index) =>
      piece.shape.map(row => row[index]).reverse()
    );
    return { ...piece, shape: rotated };
  };

  // Check if piece position is valid
  const isValidPosition = (board, piece, dx = 0, dy = 0) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + dx;
          const newY = piece.y + y + dy;
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false;
          }
          if (newY >= 0 && board[newY][newX]) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Place piece on board
  const placePiece = (board, piece) => {
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.y + y;
          const boardX = piece.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.type;
          }
        }
      }
    }
    return newBoard;
  };

  // Clear completed lines
  const clearLines = (board) => {
    const newBoard = board.filter(row => row.some(cell => cell === EMPTY_CELL));
    const clearedLines = BOARD_HEIGHT - newBoard.length;
    
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(EMPTY_CELL));
    }
    
    return { board: newBoard, clearedLines };
  };

  // Calculate score based on cleared lines
  const calculateScore = (clearedLines, currentLevel) => {
    const baseScore = [0, 40, 100, 300, 1200];
    return baseScore[clearedLines] * currentLevel;
  };

  // Get render board (current board + current piece)
  const getRenderBoard = () => {
    if (!currentPiece) return gameBoard;
    
    const renderBoard = gameBoard.map(row => [...row]);
    
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            renderBoard[boardY][boardX] = currentPiece.type;
          }
        }
      }
    }
    
    return renderBoard;
  };

  // Get cell color
  const getCellColor = (cell) => {
    if (cell === EMPTY_CELL) return 'bg-gray-800 border border-gray-700';
    return PIECES[cell]?.color || 'bg-gray-500';
  };

  // Game tick - handle piece falling
  const gameTick = useCallback(() => {
    if (!gameStarted || gameOver || !currentPiece) return;

    if (isValidPosition(gameBoard, currentPiece, 0, 1)) {
      setCurrentPiece(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      // Place piece and spawn new one
      const newBoard = placePiece(gameBoard, currentPiece);
      const { board: clearedBoard, clearedLines } = clearLines(newBoard);
      
      setGameBoard(clearedBoard);
      setLines(prev => prev + clearedLines);
      setScore(prev => prev + calculateScore(clearedLines, level));
      setLevel(prev => Math.floor((lines + clearedLines) / 10) + 1);
      
      // Check game over
      const newPiece = nextPiece || generateRandomPiece();
      if (!isValidPosition(clearedBoard, newPiece)) {
        setGameOver(true);
        setGameStarted(false);
        // Send game over to blockchain
        messageAR({
          data: { action: "GameOver", score: score, lines: lines + clearedLines },
          tags: [{ name: "Action", value: "GameOver" }],
        }).catch(console.error);
      } else {
        setCurrentPiece(newPiece);
        setNextPiece(generateRandomPiece());
      }
    }
  }, [gameBoard, currentPiece, nextPiece, gameStarted, gameOver, score, level, lines]);

  // Handle keyboard input
  const handleKeyPress = useCallback((event) => {
    if (!gameStarted || gameOver || !currentPiece) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (isValidPosition(gameBoard, currentPiece, -1, 0)) {
          setCurrentPiece(prev => ({ ...prev, x: prev.x - 1 }));
          handleMove("left");
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (isValidPosition(gameBoard, currentPiece, 1, 0)) {
          setCurrentPiece(prev => ({ ...prev, x: prev.x + 1 }));
          handleMove("right");
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (isValidPosition(gameBoard, currentPiece, 0, 1)) {
          setCurrentPiece(prev => ({ ...prev, y: prev.y + 1 }));
          handleMove("down");
        }
        break;
      case 'ArrowUp':
      case ' ':
        event.preventDefault();
        const rotatedPiece = rotatePiece(currentPiece);
        if (isValidPosition(gameBoard, rotatedPiece)) {
          setCurrentPiece(rotatedPiece);
          handleMove("rotate");
        }
        break;
    }
  }, [gameBoard, currentPiece, gameStarted, gameOver]);

  // Set up keyboard listeners and game tick
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    const interval = setInterval(gameTick, dropTime);
    return () => clearInterval(interval);
  }, [gameTick, dropTime]);

  // Adjust drop time based on level
  useEffect(() => {
    setDropTime(Math.max(50, 1000 - (level - 1) * 50));
  }, [level]);

  // Wallet connection check
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window !== 'undefined' && window.arweaveWallet) {
        try {
          const address = await getWalletAddress();
          if (address) {
            setWalletAddress(address);
            setIsWalletConnected(true);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
      setIsLoading(false);
    };

    checkWalletConnection();
  }, []);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      const address = await getWalletAddress();
      setWalletAddress(address);
      setIsWalletConnected(true);
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
      setWalletAddress("");
      setIsWalletConnected(false);
    } catch (error) {
      console.error("Wallet disconnection error:", error);
    }
  };

  // Game Logic Functions
  const startGame = async () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameBoard(createEmptyBoard());
    setCurrentPiece(generateRandomPiece());
    setNextPiece(generateRandomPiece());
    
    // Fetch initial game state from Arweave
    try {
      const initialGameState = await dryrunResult(pId, [
        { name: "Action", value: "Get-Game-State" },
      ]);
      console.log("Initial Game State:", initialGameState);
    } catch (error) {
      console.error("Error fetching initial game state:", error);
    }
  };

  const handleMove = async (direction) => {
    if (!gameStarted || gameOver) return;
    try {
      await messageAR({
        data: { action: "Move", direction: direction, score: score, level: level },
        tags: [{ name: "Action", value: "Move" }],
      });
    } catch (error) {
      console.error("Error during move:", error);
    }
  };

  const handleRestart = async () => {
    try {
      await messageAR({
        data: { action: "Restart" },
        tags: [{ name: "Action", value: "Restart" }],
      });
      
      setGameBoard(createEmptyBoard());
      setScore(0);
      setLevel(1);
      setLines(0);
      setGameOver(false);
      setGameStarted(true);
      setCurrentPiece(generateRandomPiece());
      setNextPiece(generateRandomPiece());
    } catch (error) {
      console.error("Error restarting game:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  const renderBoard = getRenderBoard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-800 text-white flex flex-col items-center py-8 font-mono">
      <nav className="w-full px-4 py-3 flex items-center justify-between">
        <div className="text-2xl font-bold">Tetris AO</div>
        <div className="flex items-center space-x-4">
          {isWalletConnected ? (
            <button
              onClick={handleDisconnectWallet}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnectWallet}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Connect Wallet
            </button>
          )}
          {walletAddress && (
            <span className="text-sm">
              {walletAddress.substring(0, 6)}...
              {walletAddress.substring(walletAddress.length - 4)}
            </span>
          )}
        </div>
      </nav>

      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome to Tetris AO</h1>
        <p className="text-gray-300">Play Tetris on the Arweave blockchain!</p>
      </header>

      <div className="flex gap-8 items-start">
        {/* Game Board */}
        <section className="bg-gray-800 rounded-lg p-6 shadow-md">
          {gameStarted && (
            <div className="flex flex-col items-center">
              <div className="grid grid-cols-10 gap-1 p-4 bg-black rounded-lg">
                {renderBoard.map((row, rowIndex) => (
                  row.map((cell, cellIndex) => (
                    <div
                      key={`${rowIndex}-${cellIndex}`}
                      className={`w-8 h-8 rounded-sm ${getCellColor(cell)}`}
                    />
                  ))
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-300 mb-2">Use arrow keys to play</div>
                <div className="text-xs text-gray-400">↑ or Space: Rotate | ↓: Soft Drop | ←→: Move</div>
              </div>
              
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={() => {
                    if (currentPiece && isValidPosition(gameBoard, currentPiece, -1, 0)) {
                      setCurrentPiece(prev => ({ ...prev, x: prev.x - 1 }));
                      handleMove("left");
                    }
                  }}
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                >
                  ← Left
                </button>
                <button
                  onClick={() => {
                    if (currentPiece) {
                      const rotatedPiece = rotatePiece(currentPiece);
                      if (isValidPosition(gameBoard, rotatedPiece)) {
                        setCurrentPiece(rotatedPiece);
                        handleMove("rotate");
                      }
                    }
                  }}
                  className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                  ↻ Rotate
                </button>
                <button
                  onClick={() => {
                    if (currentPiece && isValidPosition(gameBoard, currentPiece, 1, 0)) {
                      setCurrentPiece(prev => ({ ...prev, x: prev.x + 1 }));
                      handleMove("right");
                    }
                  }}
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                >
                  Right →
                </button>
                <button
                  onClick={() => {
                    if (currentPiece && isValidPosition(gameBoard, currentPiece, 0, 1)) {
                      setCurrentPiece(prev => ({ ...prev, y: prev.y + 1 }));
                      handleMove("down");
                    }
                  }}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  ↓ Down
                </button>
              </div>
            </div>
          )}
          
          {!gameStarted && !gameOver && (
            <div className="text-center">
              <button
                onClick={startGame}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
              >
                Start Game
              </button>
            </div>
          )}
          
          {gameOver && (
            <div className="text-center">
              <p className="text-3xl font-bold text-red-400 mb-2">Game Over!</p>
              <p className="text-xl mb-4">Final Score: {score}</p>
              <button
                onClick={handleRestart}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
              >
                Restart Game
              </button>
            </div>
          )}
        </section>

        {/* Game Stats */}
        {gameStarted && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-md min-w-48">
            <h3 className="text-xl font-bold mb-4 text-center">Game Stats</h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{score}</div>
                <div className="text-sm text-gray-400">Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">{level}</div>
                <div className="text-sm text-gray-400">Level</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">{lines}</div>
                <div className="text-sm text-gray-400">Lines</div>
              </div>
            </div>

            {/* Next Piece Preview */}
            {nextPiece && (
              <div className="mt-6">
                <h4 className="text-center text-sm text-gray-400 mb-2">Next Piece</h4>
                <div className="bg-black rounded p-2 flex justify-center">
                  <div className="grid gap-1" style={{gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 1fr)`}}>
                    {nextPiece.shape.map((row, rowIndex) => 
                      row.map((cell, cellIndex) => (
                        <div
                          key={`${rowIndex}-${cellIndex}`}
                          className={`w-5 h-5 rounded-sm ${cell ? nextPiece.color : 'bg-transparent'}`}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="mt-auto py-4 text-center text-gray-400">
        <p>&copy; {new Date().getFullYear()} Tetris AO. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;