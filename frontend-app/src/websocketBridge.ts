import { GameWebSocket } from "./api";

let activeGameWebSocket: GameWebSocket | null = null;
let activeLobbyCode: string | null = null;
let activePlayerId: string | null = null;

export function setActiveGameWebSocket(ws: GameWebSocket | null): void {
  activeGameWebSocket = ws;
}

export function getActiveGameWebSocket(): GameWebSocket | null {
  return activeGameWebSocket;
}

export function clearActiveGameWebSocket(): void {
  if (activeGameWebSocket) {
    activeGameWebSocket.disconnect();
  }
  activeGameWebSocket = null;
  activeLobbyCode = null;
  activePlayerId = null;
}

export function getOrCreateGameWebSocket(
  lobbyCode: string,
  playerId: string,
  onMessage: (data: any) => void,
  onError?: (error: Event) => void,
  onClose?: () => void
): GameWebSocket {
  const reusableWs =
    activeGameWebSocket &&
    activeLobbyCode === lobbyCode &&
    activePlayerId === playerId
      ? activeGameWebSocket
      : null;

  if (reusableWs) {
    reusableWs.setHandlers(onMessage, onError, onClose);
    if (!reusableWs.isOpen() && !reusableWs.isConnecting()) {
      reusableWs.connect();
    }
    return reusableWs;
  }

  if (activeGameWebSocket) {
    activeGameWebSocket.disconnect();
  }

  const ws = new GameWebSocket(lobbyCode, playerId, onMessage, onError, onClose);
  ws.connect();

  activeGameWebSocket = ws;
  activeLobbyCode = lobbyCode;
  activePlayerId = playerId;

  return ws;
}
