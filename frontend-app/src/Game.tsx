import { useRef, useState } from "react";
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PlayerStatus from "./PlayerStatus";
import type { Player } from "./types";
import "./Game.css";
import Spline, { type SplineEvent } from '@splinetool/react-spline';
import type { Application } from "@splinetool/runtime";

type Field = {
  f: string;
  d: number;
};

const FIELD: Field[] = [
  { f: "start_field", d: 0 },
  { f: "stock_1_field", d: 1 },
  { f: "bank_1_field", d: 2 },
  { f: "crypto_1_field", d: 3 },
  { f: "estate_1_field", d: 4 },
  { f: "chance_1_field", d: 5 },
  { f: "stock_2_field", d: 6 },
  { f: "score_field", d: 7 },
  { f: "crypto_2_field", d: 8 },
  { f: "estate_2_field", d: 9 },
  { f: "park_field", d: 10 },
  { f: "stock_3_field", d: 11 },
  { f: "bank_2_field", d: 12 },
  { f: "crypto_3_field", d: 13 },
  { f: "estate_3_field", d: 14 },
  { f: "chance_2_field", d: 15 },
  { f: "stock_4_field", d: 16 },
  { f: "tax_field", d: 17 },
  { f: "crypto_4_field", d: 18 },
  { f: "estate_4_field", d: 19 }
];
import { getActiveGameWebSocket, getOrCreateGameWebSocket } from "./websocketBridge";

type GameLocationState = {
  gameReady?: boolean;
  playerId?: string;
};

export default function Game() {
  const navigate = useNavigate();
  const { id: gameIdFromRoute } = useParams();
  const location = useLocation();
  const routeState = location.state as GameLocationState | null;
  const playerId = routeState?.playerId ?? localStorage.getItem("playerId") ?? "";
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedField, setSelectedField] = useState<Field>(FIELD[0])
  const selectedFieldRef = useRef(FIELD[0]);
  const spline = useRef<Application | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [lastWsMessage, setLastWsMessage] = useState<any>(null);

  useEffect(() => {
    selectedFieldRef.current = selectedField;
  }, [selectedField]);

  useEffect(() => {
    if (!gameIdFromRoute || !playerId) {
      return;
    }

    getOrCreateGameWebSocket(
      gameIdFromRoute,
      playerId,
      (data: any) => {
        setLastWsMessage(data);
        console.log("[Game WS]", data);
      },
      (error: Event) => {
        console.error("[Game WS] error:", error);
      },
      () => {
        console.log("[Game WS] disconnected");
      }
    );
  }, [gameIdFromRoute, playerId]);

  // Mock player data - in real app this would come from server
  const [currentPlayer] = useState<Player>({
    id: playerId || "1",
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
      name: "Player 2",
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
      name: "Player 3",
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
    console.log(currentPlayer.id);
    navigate("/");
  };

  const handleBuyProperty = () => {
    const ws = getActiveGameWebSocket();
    if (!ws) {
      console.warn("Game WebSocket is missing");
      return;
    }

    console.warn("Sending buy property action via WebSocket");

    ws.send({
      type: "move",
      move: {
        steps: 2,
        actions: []
      },
    });
  };

  const onSplineMouseDown = (e: SplineEvent) => {
    const nextField = FIELD.find(f => f.f === e.target.name);
    const pawn = spline.current?.findObjectByName("p2-start");

    if (!nextField || !pawn) return;

    const currentField = selectedFieldRef.current;
    const dist = nextField.d - currentField.d;

    // ❌ blokady
    if (dist <= 0) {
      console.log("Nie możesz się cofać ani stać w miejscu");
      return;
    }

    if (dist > 3) {
      console.log("Możesz przesunąć się maksymalnie o 3 pola");
      return;
    }

    const obj = spline.current?.findObjectByName(e.target.name);
    const prevObj = spline.current?.findObjectByName(currentField.f);

    if (obj) obj.state = "selected";
    if (prevObj) prevObj.state = "Base State";

    pawn.position.x -= dist * 370;

    setSelectedField(nextField);
    setShowModal(prev => !prev);
  };

  return (
    <div className="game-container">

      <div className="game-modal" style={{ transform: showModal ? "translateY(0)" : "translateY(100%)" }}>
        <button onClick={() => { setShowModal(prev => !prev) }}>Close</button>
        <div>
          {selectedField.f}
        </div>
      </div>

      <div className="game-header">
        <h1 className="game-title">Moneypoly</h1>
        <button className="leave-button" onClick={handleLeaveGame}>
          Leave Game
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
            <h3>Other Players</h3>
            {otherPlayers.map((player) => (
              <div
                key={player.id}
                className="other-player-card"
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="player-name">{player.name}</div>
                <div className="player-money">${player.money}</div>
                <div className="player-properties">
                  {player.properties.length} properties
                </div>
              </div>
            ))}
          </div>

          <div className="game-actions">
            <button className="action-button primary">Roll Dice</button>
            <button className="action-button" onClick={handleBuyProperty}>Buy Property</button>
            <button className="action-button">Sell Property</button>
            <button className="action-button">End Turn</button>
          </div>

          {lastWsMessage && (
            <div className="game-debug-panel">
              <h3>Last WS message</h3>
              <pre>{JSON.stringify(lastWsMessage, null, 2)}</pre>
            </div>
          )}
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
                onLoad={(s) => spline.current = s}
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}