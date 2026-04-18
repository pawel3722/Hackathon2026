const STORAGE_KEY = 'moneypoly:lastGameState';

let globalGameState: any | null = null;

export function getGlobalGameState(): any | null {
  if (globalGameState) {
    return globalGameState;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    globalGameState = JSON.parse(raw);
    return globalGameState;
  } catch {
    return null;
  }
}

export function setGlobalGameState(next: any): void {
  globalGameState = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors (private mode / quota / etc.)
  }
}

export function clearGlobalGameState(): void {
  globalGameState = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function looksLikeGameState(candidate: any): boolean {
  return Boolean(
    candidate &&
      (Array.isArray(candidate.players) || Array.isArray(candidate.stocks) || Array.isArray(candidate.cryptos))
  );
}

// Accepts raw WS messages and stores the state if present.
// Backend messages we currently handle:
// - { type: 'game_started', game_state: TurnResult }
// - { type: 'game_update', result: TurnResult | GameOver }
// - { type: 'game_state_update', game_state: ... }
export function saveGlobalGameStateFromMessage(message: any): any | null {
  const candidate =
    message?.game_state ??
    message?.result?.game_state ??
    message?.result ??
    null;

  if (looksLikeGameState(candidate)) {
    setGlobalGameState(candidate);
    return candidate;
  }

  return null;
}
