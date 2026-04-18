import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PlayerStatus from "./PlayerStatus";
import "./Game.css";

interface Player {
  id: string;
  name: string;
  money: number;
  position: number;
  properties: string[];
}

export default function Game() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Mock player data - in real app this would come from server
  const [currentPlayer] = useState<Player>({
    id: "1",
    name: "Ty",
    money: 1500,
    position: 0,
    properties: ["Ulica Marszałkowska", "Rynek Główny"]
  });

  const [otherPlayers] = useState<Player[]>([
    {
      id: "2",
      name: "Gracz 2",
      money: 1200,
      position: 5,
      properties: ["Plac Wilsona"]
    },
    {
      id: "3",
      name: "Gracz 3",
      money: 1800,
      position: 12,
      properties: ["Ulica Floriańska", "Rynek Główny"]
    }
  ]);

  const handleLeaveGame = () => {
    navigate("/");
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">Moneypoly</h1>
        <button className="leave-button" onClick={handleLeaveGame}>
            Opuść grę
          </button>
      </div>

      <div className="game-content">
        <div className="left-panel">
          {selectedPlayer ? (
            <PlayerStatus 
              player={selectedPlayer} 
              onClose={() => setSelectedPlayer(null)}
            />
          ) : (
            <PlayerStatus 
              player={currentPlayer} 
              isCurrentPlayer={true}
            />
          )}

          <div className="other-players">
            <h3>Inni gracze</h3>
            {otherPlayers.map((player) => (
              <div 
                key={player.id} 
                className="other-player-card"
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="player-name">{player.name}</div>
                <div className="player-money">${player.money}</div>
                <div className="player-properties">
                  {player.properties.length} własności
                </div>
              </div>
            ))}
          </div>

          <div className="game-actions">
            <button className="action-button primary">Rzuć kostką</button>
            <button className="action-button">Kup własność</button>
            <button className="action-button">Sprzedaj</button>
            <button className="action-button">Koniec tury</button>
          </div>
        </div>

        <div className="board-container">
          <div className="board">
            {/* Placeholder for the board game - this would be the actual game board */}
            <div className="board-placeholder">
              <div className="board-center">
                <h2>Plansza gry</h2>
                <p>Tutaj będzie plansza Monopoly/Moneypoly</p>
                <div className="board-grid">
                  {/* Mock board squares */}
                  {Array.from({ length: 40 }, (_, i) => (
                    <div key={i} className={`board-square square-${i % 4}`}>
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}