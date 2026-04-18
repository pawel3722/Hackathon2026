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
  const [selectedField, setSelectedField] = useState<Field>({ f: "start_field", d: 0 })
  const spline = useRef<Application | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [lastWsMessage, setLastWsMessage] = useState<any>(null);
  const [showMarkets, setShowMarkets] = useState(false);
  const [marketState, setMarketState] = useState<any>(() => getGlobalGameState());
  const [playerState, setPlayerState] = useState<any>(() => getGlobalGameState());


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

  const otherPlayers = allPlayers.filter((p: Player) => p.id !== playerId);

  const stocks = Array.isArray(marketState?.stocks) ? marketState.stocks : [];
  const cryptos = Array.isArray(marketState?.cryptos) ? marketState.cryptos : [];

  const onSplineMouseDown = (e: SplineEvent) => {
    console.log(e.target.name);

    const obj = spline.current?.findObjectByName(e.target.name);
    if (obj) obj.color = "#42f587";

    const pawn = spline.current?.findObjectByName("p2-start")
    console.log(pawn?.name)
    if (pawn) {
      const f = FIELD.find(f => f.f === e.target.name)!.d
      const dist = f - selectedField.d

      console.log("wybrany ", f)
      console.log("aktyalny ", selectedField.d)

      pawn.position.x -= dist * 370
    } 

    setSelectedField(prev => FIELD.find(f => f.f === e.target.name) ?? prev)
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