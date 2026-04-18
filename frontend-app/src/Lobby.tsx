import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { gameApi, apiUtils } from "./api";
import "./Lobby.css";
import WaitingScreen from "./WaitingScreen";

export default function Lobby() {
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [joinLink, setJoinLink] = useState<string>("");
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string>("");
  const [isCreator, setIsCreator] = useState<boolean>(false);

  const createSession = async () => {
    if (!name.trim()) {
      alert("Podaj imię!");
      return;
    }

    try {
      const response = await gameApi.createGame(name, difficulty);

      if (response.success && response.data) {
        setGameId(response.data.game_id);
        setIsCreator(true);
        setIsWaiting(true);
      }
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      alert(`Błąd podczas tworzenia gry: ${errorMessage}`);
    }
  };

  const joinSession = async () => {
    if (!name.trim()) {
      alert("Podaj imię!");
      return;
    }

    if (!joinLink.trim()) {
      alert("Wklej link do gry!");
      return;
    }

    try {
      // Extract game ID from link (format: http://localhost:5173/game/uuid)
      const linkParts = joinLink.split("/");
      const gameIdFromLink = linkParts[linkParts.length - 1];

      const response = await gameApi.joinGame(gameIdFromLink, name);

      if (response.success && response.data) {
        setGameId(response.data.game_id);
        setIsCreator(false);
        setIsWaiting(true);
      }
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      alert(`Błąd podczas dołączania do gry: ${errorMessage}`);
    }
  };

  const handleGameStart = async () => {
    try {
      const response = await gameApi.startGame(gameId);

      if (response.success && response.data) {
        // Navigate to the game screen using React Router
        navigate(`/game/${gameId}`);
      }
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      alert(`Błąd podczas rozpoczynania gry: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    setIsWaiting(false);
    setGameId("");
    setIsCreator(false);
    setJoinLink("");
  };

  if (isWaiting) {
    return (
      <WaitingScreen
        playerName={name}
        gameId={gameId}
        difficulty={difficulty}
        isCreator={isCreator}
        onGameStart={handleGameStart}
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
                placeholder="Wpisz swoje imię"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
                }
                className="input-field"
            />
            </div>

            <div className="lobby-columns">
            <div className="lobby-column left-column">
                <h2 className="column-title">Utwórz grę</h2>
                
                <div className="input-group">
                <label className="input-label">Poziom trudności</label>
                <select
                    value={difficulty}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setDifficulty(e.target.value)
                    }
                    className="input-field"
                >
                    <option value="easy">Łatwy</option>
                    <option value="medium">Średni</option>
                    <option value="hard">Trudny</option>
                </select>
                </div>

                <div className="input-group">
                <button onClick={createSession} className="button button-create">
                    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Utwórz grę
                </button>
                </div>
            </div>

            <div className="lobby-column right-column">
                <h2 className="column-title">Dołącz do gry</h2>
                
                <div className="input-group">
                <label className="input-label">Link do gry</label>
                <input
                    type="text"
                    placeholder="Wklej link do dołączenia"
                    value={joinLink}
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
                    Dołącz do gry
                </button>
                </div>
            </div>
            </div>
        </div>
        </div>
  );
}