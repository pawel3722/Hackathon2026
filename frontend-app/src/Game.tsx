import { useRef, useState } from "react";
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PlayerStatus from "./PlayerStatus";
import type { Player } from "./types";
import "./Game.css";
import Spline, { type SplineEvent } from '@splinetool/react-spline';
import type { Application } from "@splinetool/runtime";
import { getGlobalGameState } from "./gameStateStore";
import { PriceChart } from "./components/PriceChart";

type Field = {
  f: string;
  d: number;
};

type FieldData = {
  f: string;
  d: number;
  name: string;

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

const fieldsData: FieldData[] = [
  { f: "start_field", d: 0, name: "Start" },
  { f: "stock_1_field", d: 1, name: "Stockmarket" },
  { f: "bank_1_field", d: 2, name: "Bank" },
  { f: "crypto_1_field", d: 3, name: "Crypto" },
  { f: "estate_1_field", d: 4, name: "Estate" },
  { f: "chance_1_field", d: 5, name: "Chance" },
  { f: "stock_2_field", d: 6, name: "Stockmarket" },
  { f: "score_field", d: 7, name: "Bet" },
  { f: "crypto_2_field", d: 8, name: "Crypto" },
  { f: "estate_2_field", d: 9, name: "Estate" },
  { f: "park_field", d: 10, name: "Park" },
  { f: "stock_3_field", d: 11, name: "Stockmarket" },
  { f: "bank_2_field", d: 12, name: "Bank" },
  { f: "crypto_3_field", d: 13, name: "Crypto" },
  { f: "estate_3_field", d: 14, name: "Estate" },
  { f: "chance_2_field", d: 15, name: "Chance" },
  { f: "stock_4_field", d: 16, name: "Stockmarket" },
  { f: "tax_field", d: 17, name: "Tax" },
  { f: "crypto_4_field", d: 18, name: "Crypto" },
  { f: "estate_4_field", d: 19, name: "Estate" }
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
  const [showMarkets, setShowMarkets] = useState(false);
  const [marketState, setMarketState] = useState<any>(() => getGlobalGameState());
  const [playerState, setPlayerState] = useState<any>(() => getGlobalGameState());


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
        const gs = getGlobalGameState();
        if (gs) {
          setMarketState(gs);
          setPlayerState(gs);
        }
      },
      (error: Event) => {
        console.error("[Game WS] error:", error);
      },
      () => {
        console.log("[Game WS] disconnected");
      }
    );
  }, [gameIdFromRoute, playerId]);

  // Get player data from player state
  const allPlayers = Array.isArray(playerState?.players) ? playerState.players : [];
  
  const currentPlayer = allPlayers.find((p: Player) => p.id === playerId) || {
    id: playerId || "1",
    name: "Ty",
    money: 0,
    is_bankrupt: false,
    position: 0,
    stocks: [],
    cryptos: [],
    credits: [],
    deposits: [],
    properties: []
  };

  allPlayers.forEach((p: Player, i: number) => {
    p.pawn_id = `p${i + 1}-start`; });

  const otherPlayers = allPlayers.filter((p: Player) => p.id !== playerId);

  const stocks = Array.isArray(marketState?.stocks) ? marketState.stocks : [];
  const cryptos = Array.isArray(marketState?.cryptos) ? marketState.cryptos : [];

  const onSplineMouseDown = (e: SplineEvent) => {
    const nextField = FIELD.find(f => f.f === e.target.name);
    const pawn = spline.current?.findObjectByName(currentPlayer.pawn_id);

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


  const handleLeaveGame = () => {
    console.log(currentPlayer.id);
    navigate("/");
  };

  const handleEndTurn = () => {
    const ws = getActiveGameWebSocket();
    if (!ws) {
      console.warn("Game WebSocket is missing");
      return;
    }

    console.log("handleEndTurn")

    ws.send({
      type: "move",
      move: {
        steps: 2,
        actions: []
      },
    });
  };

  return (
    <div className="game-container">

      <div className="game-modal" style={{ transform: showModal ? "translateY(0)" : "translateY(100%)" }}>
        <button onClick={() => { setShowModal(prev => !prev) }}>Close</button>
        <div>
          {fieldsData.find(f => f.f === selectedField.f)?.name == "Start" ?(
            <div>
              <h1>Start</h1>
              <p>You receive 200 PLN for passing Start!</p>
            </div>
          ) : fieldsData.find(f => f.f === selectedField.f)?.name == "Stockmarket" ?(
           <div>
              <h1>Stock Market - {getGlobalGameState().board[selectedField.d].name}</h1>
              <p>You can buy and sell stocks here.</p>
            </div>
          ) : fieldsData.find(f => f.f === selectedField.f)?.name == "Bank" ?(
           <div>
              <h1>Bank - {getGlobalGameState().board[selectedField.d].name}</h1>
              <p>You can deposit and withdraw money here.</p>
            </div>
          ) : fieldsData.find(f => f.f === selectedField.f)?.name == "Crypto" ?(
           <div>
              <h1>Crypto Exchange - {getGlobalGameState().board[selectedField.d].name}</h1>
              <p>You can buy and sell cryptocurrencies here.</p>
            </div>
          ) : fieldsData.find(f => f.f === selectedField.f)?.name == "Estate" ?(
           <div>
              <h1>Estate - {getGlobalGameState().board[selectedField.d].name}</h1>
              <p>You can buy and sell properties here.</p>
            </div>
          ) : fieldsData.find(f => f.f === selectedField.f)?.name == "Chance" ?(
           <div>
              <h1>Chance</h1>
              <p>You can draw a Chance card here.</p>
            </div>
          ) : fieldsData.find(f => f.f === selectedField.f)?.name == "Bet" ?(
           <div>
              <h1>Bookmaker</h1>
              <p>You can place bets here.</p>
            </div>
          ) : fieldsData.find(f => f.f === selectedField.f)?.name == "Tax" ?(
           <div>
              <h1>Tax</h1>
              <p>You must pay taxes here.</p>
            </div>
          ) : (
            <div>
              <h1>Parking</h1>
              <p>You can rest here.</p>
            </div>
          )}
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
            {otherPlayers.map((player : Player) => (
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
            <button className="action-button" onClick={() => setShowMarkets((v) => !v)}>
              {showMarkets ? "Close Markets" : "Markets"}
            </button>
            <button className="action-button">Sell Property</button>
            <button className="action-button" onClick={handleEndTurn}>End Turn</button>
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
            {showMarkets ? (
              <div className="markets-view">
                {stocks.length === 0 && cryptos.length === 0 ? (
                  <div className="markets-empty">No market data yet (start the game first).</div>
                ) : (
                  <>
                    {stocks.length > 0 && (
                      <div className="markets-section">
                        <h2 className="markets-title" style={{ textAlign: "center", fontSize: "1.5rem" }}>Stocks</h2>
                        <div className="markets-grid">
                          {stocks.map((s: any) => (
                            <div key={`stock-${s.id}`} className="market-card">
                              <div className="market-card-title" style={{ textAlign: "center" }}>{s.name} - {Number(s.price).toFixed(2)} PLN</div>
                              <PriceChart priceHistory={Array.isArray(s.price_history) ? s.price_history : [s.price]} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {cryptos.length > 0 && (
                      <div className="markets-section">
                        <h2 className="markets-title" style={{ textAlign: "center", fontSize: "1.5rem" }}>Crypto</h2>
                        <div className="markets-grid">
                          {cryptos.map((c: any) => (
                            <div key={`crypto-${c.id}`} className="market-card">
                              <div className="market-card-title" style={{ textAlign: "center" }}>{c.name} - ${Number(c.price).toFixed(2)}</div>
                              <PriceChart priceHistory={Array.isArray(c.price_history) ? c.price_history : [c.price]} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="board-placeholder">
                <Spline
                  scene="https://prod.spline.design/RBNliUZGiPREVqU2/scene.splinecode"
                  onSplineMouseDown={onSplineMouseDown}
                  onLoad={(s) => spline.current = s}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}