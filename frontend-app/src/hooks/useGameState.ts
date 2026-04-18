import { useState, useEffect, useCallback } from 'react';
import type { GameState, Player, ApiResponse } from '../types';
import { gameApi, GameWebSocket, apiUtils } from '../api';

interface UseGameStateReturn {
  gameState: GameState | null;
  currentPlayer: Player | null;
  isLoading: boolean;
  error: string | null;
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  createGame: (playerName: string, difficulty: string, maxPlayers: number) => Promise<void>;
  startGame: () => Promise<void>;
  makeMove: (action: string, data?: any) => Promise<void>;
  rollDice: () => Promise<void>;
  buyProperty: (propertyId: number) => Promise<void>;
  sellProperty: (propertyId: number) => Promise<void>;
  buyStock: (stockId: number, quantity: number) => Promise<void>;
  sellStock: (stockId: number, quantity: number) => Promise<void>;
  buyCrypto: (cryptoId: number, quantity: number) => Promise<void>;
  sellCrypto: (cryptoId: number, quantity: number) => Promise<void>;
  takeCredit: (amount: number, interestRate: number, payments: number) => Promise<void>;
  makeDeposit: (amount: number, interestRate: number, maturityDate: string) => Promise<void>;
  endTurn: () => Promise<void>;
  leaveGame: () => Promise<void>;
  refreshGameState: () => Promise<void>;
}

export function useGameState(gameId?: string): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<GameWebSocket | null>(null);

  // Initialize WebSocket connection when gameId is available
  useEffect(() => {
    if (gameId && gameState) {
      const ws = new GameWebSocket(
        gameId,
        (data: any) => {
          // Handle real-time updates
          if (data.type === 'game_state_update') {
            setGameState(data.game_state);
            // Update current player if it's in the update
            const player = data.game_state.players.find((p: Player) =>
              p.id === localStorage.getItem('playerId')
            );
            if (player) {
              setCurrentPlayer(player);
            }
          }
        },
        (error: Event) => {
          console.error('WebSocket error:', error);
          setError('Connection lost. Attempting to reconnect...');
        },
        () => {
          console.log('WebSocket disconnected');
        }
      );

      ws.connect();
      setWsConnection(ws);

      return () => {
        ws.disconnect();
      };
    }
  }, [gameId, gameState]);

  const handleApiCall = useCallback(async <T,>(
    apiCall: () => Promise<ApiResponse<T>>,
    successCallback?: (result: ApiResponse<T>) => void
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiCall();

      if (successCallback) {
        successCallback(result);
      }

      return result;
    } catch (err) {
      const errorMessage = apiUtils.handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinGame = useCallback(async (gameId: string, playerName: string) => {
    await handleApiCall(
      () => gameApi.joinGame(gameId, playerName),
      (response) => {
        if (response.success && response.data) {
          setGameState(response.data);
          // Find current player in the game state
          const player = response.data.players.find((p: Player) => p.name === playerName);
          if (player) {
            setCurrentPlayer(player);
            localStorage.setItem('playerId', player.id);
          }
        }
      }
    );
  }, [handleApiCall]);

  const createGame = useCallback(async (playerName: string, difficulty: string, maxPlayers: number) => {
    await handleApiCall(
      () => gameApi.createGame(playerName, difficulty, maxPlayers),
      (response) => {
        if (response.success && response.data) {
          setGameState(response.data);
          // Creator is the first player
          const player = response.data.players[0];
          if (player) {
            setCurrentPlayer(player);
            localStorage.setItem('playerId', player.id);
          }
        }
      }
    );
  }, [handleApiCall]);

  const startGame = useCallback(async () => {
    if (!gameState) return;

    await handleApiCall(
      () => gameApi.startGame(gameState.game_id),
      (response) => {
        if (response.success && response.data) {
          setGameState(response.data);
        }
      }
    );
  }, [gameState, handleApiCall]);

  const makeMove = useCallback(async (action: string, data?: any) => {
    if (!gameState) return;

    await handleApiCall(
      () => gameApi.makeMove(gameState.game_id, { action, data }),
      (response) => {
        if (response.success && response.data) {
          setGameState(response.data);
        }
      }
    );
  }, [gameState, handleApiCall]);

  const rollDice = useCallback(async () => {
    if (!gameState) return;

    await handleApiCall(
      () => gameApi.rollDice(gameState.game_id),
      (response) => {
        if (response.success && response.data) {
          setGameState(response.data);
        }
      }
    );
  }, [gameState, handleApiCall]);

  const buyProperty = useCallback(async (propertyId: number) => {
    if (!gameState) return;

    await handleApiCall(
      () => gameApi.buyProperty(gameState.game_id, propertyId),
      (response) => {
        if (response.success && response.data) {
          setCurrentPlayer(response.data.player);
          setGameState(response.data.game_state);
        }
      }
    );
  }, [gameState, handleApiCall]);

  const sellProperty = useCallback(async (propertyId: number) => {
    if (!gameState) return;

    await handleApiCall(
      () => gameApi.sellProperty(gameState.game_id, propertyId),
      (response) => {
        if (response.success && response.data) {
          setCurrentPlayer(response.data.player);
          setGameState(response.data.game_state);
        }
      }
    );
  }, [gameState, handleApiCall]);

  const buyStock = useCallback(async (stockId: number, quantity: number) => {
    if (!gameState) return;

    await handleApiCall(
      () => gameApi.buyStock(gameState.game_id, stockId, quantity),
      (response) => {
        if (response.success && response.data) {
          setCurrentPlayer(response.data.player);
          setGameState(response.data.game_state);
        }
      }
    );
  }, [gameState, handleApiCall]);

  const sellStock = useCallback(async (stockId: number, quantity: number) => {
    if (!gameState) return;

    await handleApiCall(
      () => gameApi.sellStock(gameState.game_id, stockId, quantity),
      (response) => {
        if (response.success && response.data) {
          setCurrentPlayer(response.data.player);
          setGameState(response.data.game_state);
        }
      }
    );
  }, [gameState, handleApiCall]);

  const buyCrypto = useCallback(async (cryptoId: number, quantity: number) => {
    if (!gameState) return;

    await handleApiCall(
      () => gameApi.buyCrypto(gameState.game_id, cryptoId, quantity),
      (response) => {
        if (response.success && response.data) {
          setCurrentPlayer(response.data.player);
          setGameState(response.data.game_state);
        }
      }
    );
  }, [gameState, handleApiCall]);

  const sellCrypto = useCallback(async (cryptoId: number, quantity: number) => {
    if (!gameState) return;

    await handleApiCall(
      () => gameApi.sellCrypto(gameState.game_id, cryptoId, quantity),
      (response) => {
        if (response.success && response.data) {
          setCurrentPlayer(response.data.player);
          setGameState(response.data.game_state);
        }
      }
    );
  }, [gameState, handleApiCall]);

  const takeCredit = useCallback(async (amount: number, interestRate: number, payments: number) => {
    if (!gameState) return;

    await handleApiCall(
      () => gameApi.takeCredit(gameState.game_id, amount, interestRate, payments),
      (response) => {
        if (response.success && response.data) {
          setCurrentPlayer(response.data.player);
          setGameState(response.data.game_state);
        }
      }
    );
  }, [gameState, handleApiCall]);

  const makeDeposit = useCallback(async (amount: number, interestRate: number, maturityDate: string) => {
    if (!gameState) return;

    await handleApiCall(
      () => gameApi.makeDeposit(gameState.game_id, amount, interestRate, maturityDate),
      (response) => {
        if (response.success && response.data) {
          setCurrentPlayer(response.data.player);
          setGameState(response.data.game_state);
        }
      }
    );
  }, [gameState, handleApiCall]);

  const endTurn = useCallback(async () => {
    if (!gameState) return;

    await handleApiCall(
      () => gameApi.endTurn(gameState.game_id),
      (response) => {
        if (response.success && response.data) {
          setGameState(response.data);
        }
      }
    );
  }, [gameState, handleApiCall]);

  const leaveGame = useCallback(async () => {
    if (!gameState) return;

    await handleApiCall(
      () => gameApi.leaveGame(gameState.game_id),
      () => {
        setGameState(null);
        setCurrentPlayer(null);
        localStorage.removeItem('playerId');
        if (wsConnection) {
          wsConnection.disconnect();
        }
      }
    );
  }, [gameState, wsConnection, handleApiCall]);

  const refreshGameState = useCallback(async () => {
    if (!gameId) return;

    await handleApiCall(
      () => gameApi.getGameState(gameId),
      (response) => {
        if (response.success && response.data) {
          setGameState(response.data);
          const playerId = localStorage.getItem('playerId');
          if (playerId) {
            const player = response.data.players.find(p => p.id === playerId);
            if (player) {
              setCurrentPlayer(player);
            }
          }
        }
      }
    );
  }, [gameId, handleApiCall]);

  return {
    gameState,
    currentPlayer,
    isLoading,
    error,
    joinGame,
    createGame,
    startGame,
    makeMove,
    rollDice,
    buyProperty,
    sellProperty,
    buyStock,
    sellStock,
    buyCrypto,
    sellCrypto,
    takeCredit,
    makeDeposit,
    endTurn,
    leaveGame,
    refreshGameState,
  };
}