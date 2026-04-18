// types.ts - TypeScript interfaces for Moneypoly game server responses

export interface Stock {
  id: number;
  ticker: string;
  name: string;
  industry: string; // enum-like: fuel, food, media, etc.
  price: number;
  number_of_shares: number;
}

export interface Crypto {
  id: number;
  ticker: string;
  name: string;
  price: number;
}

export interface Property {
  id: number;
  name: string;
  price: number;
  rent: number;
  energy_use: number;
}

export interface ChanceCard {
  id: number;
  description: string;
}

// Supporting interfaces for Player
export interface StockShare {
  stock_id: number;
  quantity: number;
  purchase_price: number;
}

export interface CryptoShare {
  crypto_id: number;
  quantity: number;
  purchase_price: number;
}

export interface Credit {
  id: number;
  amount: number;
  interest_rate: number;
  remaining_payments: number;
}

export interface Deposit {
  id: number;
  amount: number;
  interest_rate: number;
  maturity_date: string; // ISO date string
}

export interface Player {
  id: string;
  name: string;
  money: number;
  is_bankrupt: boolean;
  position: number;
  stocks: StockShare[];
  cryptos: CryptoShare[];
  credits: Credit[];
  deposits: Deposit[];
  properties: Property[];
}

// Game state interfaces
export interface GameState {
  game_id: string;
  players: Player[];
  current_player_id: string;
  stocks: Stock[];
  cryptos: Crypto[];
  properties: Property[];
  chance_cards: ChanceCard[];
  game_status: GameStatusType;
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Specific response types
export interface GameJoinResponse extends ApiResponse<GameState> {
  user_id?: string;
}
export interface GameMoveResponse extends ApiResponse<GameState> {}
export interface PlayerActionResponse extends ApiResponse<{ player: Player; game_state: GameState }> {}
export type CreateGameResponse = { lobby_id: string };

// Enums for type safety
export const Industry = {
  FUEL: 'fuel',
  FOOD: 'food',
  MEDIA: 'media',
  TECH: 'tech',
  REAL_ESTATE: 'real_estate',
  UTILITIES: 'utilities',
  TRANSPORT: 'transport',
  HEALTHCARE: 'healthcare',
  FINANCE: 'finance',
} as const;

export type IndustryType = typeof Industry[keyof typeof Industry];

export const GameStatus = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  FINISHED: 'finished',
} as const;

export type GameStatusType = typeof GameStatus[keyof typeof GameStatus];

interface Action {
  action_type: string; // "buy", "sell", "bank", "stakeholder", "card"
  assets_type: string; // "stock", "crypto", "property", "credit", "deposit", "insurance"
  assets_id: number; // ID aktywa
  amount: number; // ilość lub kwota
}

export interface Move {
  steps: number; // liczba kroków (0-3)
  actions: Action[]; // lista akcji
}

interface PlayerEndGame {
  id: string;
  money: number;
  is_bankrupt: boolean;
  position: number;
  insurance: number;
  stocks: any[]; // Lista akcji (StockShare)
  cryptos: any[]; // Lista kryptowalut (CryptoShare)
  credits: any[]; // Lista kredytów (Credit)
  deposits: any[]; // Lista depozytów (Deposit)
  properties: any[]; // Lista nieruchomości (Property)
  all_money: number; // Całkowite pieniądze
}

export interface GameOver {
  game_ended: boolean; // zawsze true
  players: PlayerEndGame[]; // lista graczy na koniec gry
  turn: number; // numer tury
}