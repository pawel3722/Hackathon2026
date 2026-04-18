import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PlayerStatus from "./PlayerStatus";
import type { Player } from "./types";
import "./Game.css";
import Spline, { type SplineEvent } from '@splinetool/react-spline';

export default function Game() {
  const navigate = useNavigate();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Mock player data - in real app this would come from server
  const [currentPlayer] = useState<Player>({
    id: "1",
    name: "Ty",
    money: 1500.00,
    is_bankrupt: false,
    position: 0,
    stocks: [],
    cryptos: [],
    credits: [],
    deposits: [],
    properties: [
      { id: 1, name: "Ulica Marszałkowska", price: 400, rent: 40, energy_use: 10 },
      { id: 2, name: "Rynek Główny", price: 600, rent: 60, energy_use: 15 }
    ]
  });

  const [otherPlayers] = useState<Player[]>([
    {
      id: "2",
      name: "Gracz 2",
      money: 1200.00,
      is_bankrupt: false,
      position: 5,
      stocks: [],
      cryptos: [],
      credits: [],
      deposits: [],
      properties: [
        { id: 3, name: "Plac Wilsona", price: 350, rent: 35, energy_use: 8 }
      ]
    },
    {
      id: "3",
      name: "Gracz 3",
      money: 1800.00,
      is_bankrupt: false,
      position: 12,
      stocks: [],
      cryptos: [],
      credits: [],
      deposits: [],
      properties: [
        { id: 4, name: "Ulica Floriańska", price: 500, rent: 50, energy_use: 12 },
        { id: 5, name: "Rynek Główny", price: 600, rent: 60, energy_use: 15 }
      ]
    }
  ]);

  const handleLeaveGame = () => {
    navigate("/");
  };

  const onSplineMouseDown = (e: SplineEvent) => {
    console.log(e.target.name)
  }

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
              {/* <div className="board-center">
                <h2>Plansza gry</h2>
                <p>Tutaj będzie plansza Monopoly/Moneypoly</p>
                <div className="board-grid">
                  
                  {Array.from({ length: 40 }, (_, i) => (
                    <div key={i} className={`board-square square-${i % 4}`}>
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div> */}
              <Spline
                scene="https://prod.spline.design/RBNliUZGiPREVqU2/scene.splinecode"
                onSplineMouseDown={onSplineMouseDown}
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}