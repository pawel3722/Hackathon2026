import type {
  Player,
  GameState,
  ApiResponse,
  GameJoinResponse,
  GameMoveResponse,
  PlayerActionResponse,
  CreateGameResponse,
  Stock,
  Crypto,
  Property,
  ChanceCard
} from './types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new ApiError(response.status, errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, error instanceof Error ? error.message : 'Network error');
  }
}

// Game API Service
export const gameApi = {
  // Create a new game session using HTTP
  createGame: async (): Promise<CreateGameResponse> => {
    return apiRequest<CreateGameResponse>('/create', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // Join an existing game
  joinGame: async (gameId: string, playerName: string): Promise<GameJoinResponse> => {
    return apiRequest<GameJoinResponse>(`/join/${gameId}?name=${playerName}`, {
      method: 'POST',
      body: JSON.stringify({
      }),
    });
  },

  // Get current game state
  getGameState: async (gameId: string): Promise<ApiResponse<GameState>> => {
    return apiRequest<ApiResponse<GameState>>(`/games/${gameId}`);
  },

  // Start the game (creator only)
  startGame: async (gameId: string): Promise<ApiResponse<GameState>> => {
    return apiRequest<ApiResponse<GameState>>(`/games/${gameId}/start`, {
      method: 'POST',
    });
  },

  // Make a move in the game
  makeMove: async (gameId: string, moveData: {
    action: string;
    data?: any;
  }): Promise<GameMoveResponse> => {
    return apiRequest<GameMoveResponse>(`/games/${gameId}/move`, {
      method: 'POST',
      body: JSON.stringify(moveData),
    });
  },

  // Roll dice
  rollDice: async (gameId: string): Promise<GameMoveResponse> => {
    return apiRequest<GameMoveResponse>(`/games/${gameId}/roll-dice`, {
      method: 'POST',
    });
  },

  // Buy property
  buyProperty: async (gameId: string, propertyId: number): Promise<PlayerActionResponse> => {
    return apiRequest<PlayerActionResponse>(`/games/${gameId}/buy-property`, {
      method: 'POST',
      body: JSON.stringify({ property_id: propertyId }),
    });
  },

  // Sell property
  sellProperty: async (gameId: string, propertyId: number): Promise<PlayerActionResponse> => {
    return apiRequest<PlayerActionResponse>(`/games/${gameId}/sell-property`, {
      method: 'POST',
      body: JSON.stringify({ property_id: propertyId }),
    });
  },

  // Buy stock
  buyStock: async (gameId: string, stockId: number, quantity: number): Promise<PlayerActionResponse> => {
    return apiRequest<PlayerActionResponse>(`/games/${gameId}/buy-stock`, {
      method: 'POST',
      body: JSON.stringify({ stock_id: stockId, quantity }),
    });
  },

  // Sell stock
  sellStock: async (gameId: string, stockId: number, quantity: number): Promise<PlayerActionResponse> => {
    return apiRequest<PlayerActionResponse>(`/games/${gameId}/sell-stock`, {
      method: 'POST',
      body: JSON.stringify({ stock_id: stockId, quantity }),
    });
  },

  // Buy crypto
  buyCrypto: async (gameId: string, cryptoId: number, quantity: number): Promise<PlayerActionResponse> => {
    return apiRequest<PlayerActionResponse>(`/games/${gameId}/buy-crypto`, {
      method: 'POST',
      body: JSON.stringify({ crypto_id: cryptoId, quantity }),
    });
  },

  // Sell crypto
  sellCrypto: async (gameId: string, cryptoId: number, quantity: number): Promise<PlayerActionResponse> => {
    return apiRequest<PlayerActionResponse>(`/games/${gameId}/sell-crypto`, {
      method: 'POST',
      body: JSON.stringify({ crypto_id: cryptoId, quantity }),
    });
  },

  // Take credit/loan
  takeCredit: async (gameId: string, amount: number, interestRate: number, payments: number): Promise<PlayerActionResponse> => {
    return apiRequest<PlayerActionResponse>(`/games/${gameId}/take-credit`, {
      method: 'POST',
      body: JSON.stringify({ amount, interest_rate: interestRate, payments }),
    });
  },

  // Make deposit
  makeDeposit: async (gameId: string, amount: number, interestRate: number, maturityDate: string): Promise<PlayerActionResponse> => {
    return apiRequest<PlayerActionResponse>(`/games/${gameId}/make-deposit`, {
      method: 'POST',
      body: JSON.stringify({ amount, interest_rate: interestRate, maturity_date: maturityDate }),
    });
  },

  // End turn
  endTurn: async (gameId: string): Promise<GameMoveResponse> => {
    return apiRequest<GameMoveResponse>(`/games/${gameId}/end-turn`, {
      method: 'POST',
    });
  },

  // Leave game
  leaveGame: async (gameId: string): Promise<ApiResponse<{ success: boolean }>> => {
    return apiRequest<ApiResponse<{ success: boolean }>>(`/games/${gameId}/leave`, {
      method: 'POST',
    });
  },
};

// Market Data API Service
export const marketApi = {
  // Get all available stocks
  getStocks: async (): Promise<ApiResponse<Stock[]>> => {
    return apiRequest<ApiResponse<Stock[]>>('/market/stocks');
  },

  // Get all available cryptos
  getCryptos: async (): Promise<ApiResponse<Crypto[]>> => {
    return apiRequest<ApiResponse<Crypto[]>>('/market/cryptos');
  },

  // Get all available properties
  getProperties: async (): Promise<ApiResponse<Property[]>> => {
    return apiRequest<ApiResponse<Property[]>>('/market/properties');
  },

  // Get chance cards
  getChanceCards: async (): Promise<ApiResponse<ChanceCard[]>> => {
    return apiRequest<ApiResponse<ChanceCard[]>>('/market/chance-cards');
  },

  // Get current market prices (real-time updates)
  getMarketPrices: async (): Promise<ApiResponse<{
    stocks: Stock[];
    cryptos: Crypto[];
  }>> => {
    return apiRequest<ApiResponse<{
      stocks: Stock[];
      cryptos: Crypto[];
    }>>('/market/prices');
  },
};

// Player API Service
export const playerApi = {
  // Get player profile
  getProfile: async (): Promise<ApiResponse<Player>> => {
    return apiRequest<ApiResponse<Player>>('/player/profile');
  },

  // Update player profile
  updateProfile: async (updates: Partial<Player>): Promise<ApiResponse<Player>> => {
    return apiRequest<ApiResponse<Player>>('/player/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Get player's game history
  getGameHistory: async (): Promise<ApiResponse<{
    games: Array<{
      game_id: string;
      status: string;
      final_position?: number;
      final_money?: number;
      played_at: string;
    }>;
  }>> => {
    return apiRequest<ApiResponse<{
      games: Array<{
        game_id: string;
        status: string;
        final_position?: number;
        final_money?: number;
        played_at: string;
      }>;
    }>>('/player/history');
  },
};

// WebSocket connection for real-time updates
export class GameWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private gameId: string;
  private userId: string;;
  private onMessage: (data: any) => void;
  private onError?: (error: Event) => void;
  private onClose?: () => void;

  constructor(
    gameId: string,
    userId: string,
    onMessage: (data: any) => void,
    onError?: (error: Event) => void,
    onClose?: () => void
  ) {
    this.gameId = gameId;
    this.userId = userId;
    this.onMessage = onMessage;
    this.onError = onError;
    this.onClose = onClose;
  }

  connect(): void {
    const token = localStorage.getItem('authToken');
    const params = new URLSearchParams();

    if (token) {
      params.set('token', token);
    }
    if (this.userId) {
      params.set('user_id', this.userId);
    }

    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/${this.gameId}?${params.toString()}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (this.onError) {
        this.onError(error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      if (this.onClose) {
        this.onClose();
      }
      this.attemptReconnect();
    };
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Utility functions
export const apiUtils = {
  // Set auth token
  setAuthToken: (token: string): void => {
    localStorage.setItem('authToken', token);
  },

  // Clear auth token
  clearAuthToken: (): void => {
    localStorage.removeItem('authToken');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },

  // Handle API errors
  handleApiError: (error: unknown): string => {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 400:
          return 'Nieprawidłowe dane wejściowe';
        case 401:
          return 'Brak autoryzacji';
        case 403:
          return 'Brak dostępu';
        case 404:
          return 'Nie znaleziono';
        case 409:
          return 'Konflikt danych';
        case 422:
          return 'Błąd walidacji';
        case 500:
          return 'Błąd serwera';
        default:
          return error.message;
      }
    }
    return 'Wystąpił nieoczekiwany błąd';
  },
};