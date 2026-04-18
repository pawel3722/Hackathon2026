import type {
  GameJoinResponse,
  CreateGameResponse,
} from './types';

import { saveGlobalGameStateFromMessage } from './gameStateStore';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

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

};

// WebSocket connection for real-time updates
export class GameWebSocket {
  private ws: WebSocket | null = null;

  private gameId: string;
  private userId: string;
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

  setHandlers(
    onMessage: (data: any) => void,
    onError?: (error: Event) => void,
    onClose?: () => void
  ): void {
    this.onMessage = onMessage;
    this.onError = onError;
    this.onClose = onClose;
  }

  isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  isConnecting(): boolean {
    return this.ws?.readyState === WebSocket.CONNECTING;
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl =
      `${import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8000/ws/`}${this.gameId}?user_id=${this.userId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to game WebSocket');
    };

    this.ws.onmessage = (event) => {
      let msg: any;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        console.warn('Received non-JSON WebSocket message:', event.data);
        return;
      }

      // Persist the latest server game state globally if present.
      saveGlobalGameStateFromMessage(msg);

      console.log('Received WebSocket message:', msg);
      this.onMessage(msg);
    };

    this.ws.onerror = (err: Event) => {
      console.error('WS error', err);
      if (this.onError) {
        this.onError(err);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      if (this.onClose) {
        this.onClose();
      }
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not open, cannot send data');
    }
  }
}

// Utility functions
export const apiUtils = {
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