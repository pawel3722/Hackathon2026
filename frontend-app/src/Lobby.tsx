import { useState } from "react";
import { gameApi, apiUtils } from "./api";
import "./Lobby.css";
import WaitingScreen from "./WaitingScreen";

export default function Lobby() {
  const [name, setName] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [joinGameId, setJoinLink] = useState<string>("");
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string>("");
  const [lobbyId, setLobbyId] = useState<string>("");
  const [playerId, setPlayerId] = useState<string>("");
  const [isCreator, setIsCreator] = useState<boolean>(false);

  const createSession = async () => {
    if (!name.trim()) {
      alert("Enter your name!");
      return;
    }

    let localGameId = "";

    try {
      const response = await gameApi.createGame();
      localGameId = response.lobby_id;

      if (!localGameId) {
        throw new Error('Invalid server response: missing lobby_id');
      }

      setLobbyId(localGameId);
      setGameId(localGameId);
      setIsCreator(true);
      setIsWaiting(true);
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      alert(`Error creating game: ${errorMessage}`);
      return;
    }

    try {
      const response = await gameApi.joinGame(localGameId, name);
      const joinPlayerId = response.user_id;

      if (joinPlayerId) {
        setPlayerId(joinPlayerId);
        localStorage.setItem('playerId', joinPlayerId);
      }

      if (response.success && response.data) {
        setGameId(response.data.game_id || localGameId);
      }
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      alert(`Error joining game: ${errorMessage}`);
    }
  };

  const joinSession = async () => {
    console.log('joinSession called');
    if (!name.trim()) {
      alert("Enter your name!");
      return;
    }

    if (!joinGameId.trim()) {
      alert("Paste the game ID!");
      return;
    }

    console.log('Parsing game ID from:', joinGameId);
    const linkParts = joinGameId.split("/");
    const gameIdFromLink = linkParts[linkParts.length - 1];
    console.log('Extracted game ID:', gameIdFromLink);

    console.log('Calling gameApi.joinGame with:', gameIdFromLink, name);
    try {
      setLobbyId(gameIdFromLink);

      const response = await gameApi.joinGame(gameIdFromLink, name);
      console.log('joinGame response:', response.success, response.data, response.error);
      const joinPlayerId = response.user_id;

      if (joinPlayerId) {
        setPlayerId(joinPlayerId);
        localStorage.setItem('playerId', joinPlayerId);
        console.log('Player ID set:', joinPlayerId);
      } else {
        console.warn('No user_id in response');
      }

      setIsCreator(false);
        setIsWaiting(true);
        console.log('Setting isWaiting to true');
        
    } catch (error) {
      console.error('Error in joinSession:', error);
      const errorMessage = apiUtils.handleApiError(error);
      alert(`Error joining game: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    setIsWaiting(false);
    setGameId("");
    setLobbyId("");
    setPlayerId("");
    setIsCreator(false);
    setJoinLink("");
  };

  if (isWaiting) {
    return (
      <WaitingScreen
        playerName={name}
        gameId={lobbyId || gameId}
        playerId={playerId}
        difficulty={difficulty}
        isCreator={isCreator}
        onCancel={handleCancel}
      />
    );
  }

  return (
        <div className="lobby-container">
        <div className="lobby-card">
            <h1 className="lobby-title">Moneypoly</h1>

            <div className="input-group">
            <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
                }
                className="input-field"
            />
            </div>

            <div className="lobby-columns">
            <div className="lobby-column left-column">
                <h2 className="column-title">Create game</h2>
                
                <div className="input-group">
                <label className="input-label">Difficulty level</label>
                <select
                    value={difficulty}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setDifficulty(e.target.value)
                    }
                    className="input-field"
                >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
                </div>

                <div className="input-group">
                <button onClick={createSession} className="button button-create">
                    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Game
                </button>
                </div>
            </div>

            <div className="lobby-column right-column">
                <h2 className="column-title">Join game</h2>
                
                <div className="input-group">
                <label className="input-label">Game link</label>
                <input
                    type="text"
                    placeholder="Paste game link"
                    value={joinGameId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setJoinLink(e.target.value)
                    }
                    className="input-field"
                />
                </div>

                <div className="input-group">
                <button onClick={joinSession} className="button button-join">
                    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Join game
                </button>
                </div>
            </div>
            </div>
        </div>
        </div>
  );
}