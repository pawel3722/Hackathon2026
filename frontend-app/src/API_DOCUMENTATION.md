# Moneypoly Frontend API Services

This document explains how to use the API services for communicating with the Moneypoly backend.

## 🚀 Quick Start

```typescript
import { gameApi, marketApi, playerApi, useGameState } from './api';

// In a React component
function MyComponent() {
  const {
    gameState,
    currentPlayer,
    joinGame,
    createGame,
    rollDice,
    buyProperty
  } = useGameState();

  // Create a new game
  const handleCreateGame = async () => {
    try {
      await createGame("PlayerName", "medium", 4);
    } catch (error) {
      console.error("Failed to create game:", error);
    }
  };

  // Join existing game
  const handleJoinGame = async () => {
    try {
      await joinGame("game-uuid", "PlayerName");
    } catch (error) {
      console.error("Failed to join game:", error);
    }
  };
}
```

## 📡 API Services

### Game API (`gameApi`)

#### Game Management
```typescript
// Create new game
await gameApi.createGame(playerName, difficulty, maxPlayers);

// Join existing game
await gameApi.joinGame(gameId, playerName);

// Start game (creator only)
await gameApi.startGame(gameId);

// Get current game state
await gameApi.getGameState(gameId);
```

#### Game Actions
```typescript
// Roll dice
await gameApi.rollDice(gameId);

// Buy/Sell properties
await gameApi.buyProperty(gameId, propertyId);
await gameApi.sellProperty(gameId, propertyId);

// Stock trading
await gameApi.buyStock(gameId, stockId, quantity);
await gameApi.sellStock(gameId, stockId, quantity);

// Crypto trading
await gameApi.buyCrypto(gameId, cryptoId, quantity);
await gameApi.sellCrypto(gameId, cryptoId, quantity);

// Banking
await gameApi.takeCredit(gameId, amount, interestRate, payments);
await gameApi.makeDeposit(gameId, amount, interestRate, maturityDate);

// End turn
await gameApi.endTurn(gameId);

// Leave game
await gameApi.leaveGame(gameId);
```

### Market API (`marketApi`)

```typescript
// Get available assets
const stocks = await marketApi.getStocks();
const cryptos = await marketApi.getCryptos();
const properties = await marketApi.getProperties();
const chanceCards = await marketApi.getChanceCards();

// Get real-time prices
const prices = await marketApi.getMarketPrices();
```

### Player API (`playerApi`)

```typescript
// Get player profile
const profile = await playerApi.getProfile();

// Update profile
await playerApi.updateProfile({ name: "New Name" });

// Get game history
const history = await playerApi.getGameHistory();
```

## 🔧 Custom Hook: `useGameState`

The `useGameState` hook provides a complete game state management solution:

```typescript
const {
  gameState,        // Current game state
  currentPlayer,    // Current player's data
  isLoading,        // Loading state
  error,           // Error messages
  joinGame,        // Join game function
  createGame,      // Create game function
  startGame,       // Start game function
  rollDice,        // Roll dice function
  buyProperty,     // Buy property function
  // ... many more functions
} = useGameState(gameId);
```

### Features:
- ✅ **Automatic WebSocket connection** for real-time updates
- ✅ **Error handling** with user-friendly messages
- ✅ **Loading states** for all operations
- ✅ **Type-safe** API calls
- ✅ **Automatic reconnection** on connection loss

## 🌐 WebSocket Real-time Updates

```typescript
import { GameWebSocket } from './api';

const ws = new GameWebSocket(
  gameId,
  (data) => {
    // Handle real-time updates
    if (data.type === 'game_state_update') {
      console.log('Game state updated:', data.game_state);
    }
  },
  (error) => console.error('WebSocket error:', error),
  () => console.log('Connection closed')
);

ws.connect();

// Send messages
ws.send({ type: 'player_action', action: 'roll_dice' });

// Cleanup
ws.disconnect();
```

## ⚙️ Configuration

Set your API endpoints in environment variables:

```bash
# .env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000
```

## 🛡️ Error Handling

All API calls include comprehensive error handling:

```typescript
import { apiUtils } from './api';

try {
  await gameApi.rollDice(gameId);
} catch (error) {
  const userFriendlyMessage = apiUtils.handleApiError(error);
  alert(userFriendlyMessage);
}
```

## 🔐 Authentication

```typescript
import { apiUtils } from './api';

// Set auth token
apiUtils.setAuthToken('your-jwt-token');

// Check authentication
if (apiUtils.isAuthenticated()) {
  // User is logged in
}

// Clear token on logout
apiUtils.clearAuthToken();
```

## 📝 API Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## 🎮 Game Flow Example

```typescript
// 1. Create or join game
await createGame("Alice", "hard", 4);

// 2. Wait for players to join
// (handled by WaitingScreen component)

// 3. Start game (creator only)
await startGame();

// 4. Game loop
while (gameActive) {
  await rollDice();
  // Make decisions based on roll result
  if (canBuyProperty) {
    await buyProperty(propertyId);
  }
  await endTurn();
}
```

## 🔍 TypeScript Support

All API services are fully typed with TypeScript interfaces from `types.ts`. This provides:

- IntelliSense support
- Compile-time error checking
- Type-safe API responses
- Better developer experience

Enjoy building your Moneypoly game! 🎲💰