import { useRef, useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PlayerStatus from "./PlayerStatus";
import type { Player, Action } from "./types";
import "./Game.css";
import Spline, { type SplineEvent } from '@splinetool/react-spline';
import type { Application } from "@splinetool/runtime";
import { getGlobalGameState } from "./gameStateStore";
import { PriceChart } from "./components/PriceChart";
import { StockMarketModal } from "./components/StockMarketModal";
import { BankModal } from "./components/BankModal";
import { ChanceModal } from "./components/ChanceModal";

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
  const spline = useRef<Application | null>(null);
  const initPositions = useRef<Record<string, number>>({});
  const [showModal, setShowModal] = useState(false)
  const [showMarkets, setShowMarkets] = useState(false);
  const [showStockMarketModal, setShowStockMarketModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showChanceModal, setShowChanceModal] = useState(false);
  const [pendingActions, setPendingActions] = useState<Action[]>([]);
  const [marketState, setMarketState] = useState<any>(() => getGlobalGameState());
  const [playerState, setPlayerState] = useState<any>(() => getGlobalGameState());
  const [isWaitingForState, setIsWaitingForState] = useState(false);
  const [, setHasMovedThisTurn] = useState(false);
  const hasMovedThisTurnRef = useRef(false);

  const [selectedObserveField, setSelectedObserveField] = useState<Field>(FIELD[0])
  const [observe, setObserve] = useState(false)
  const observeRef = useRef(observe);


  useEffect(() => {
    observeRef.current = observe;
  }, [observe]);

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
        console.log("[Game WS]", data);
        const gs = getGlobalGameState();
        if (gs) {
          setMarketState(gs);
          setPlayerState(gs);
          setIsWaitingForState(false);
          setHasMovedThisTurn(false);
          hasMovedThisTurnRef.current = false;
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
  const allPlayers = useMemo(() => Array.isArray(playerState?.players) ? playerState.players : [], [playerState]);

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
    p.pawn_id = `p${i + 1}-start`;
  });

  const otherPlayers = allPlayers.filter((p: Player) => p.id !== playerId);

  const stocks = Array.isArray(marketState?.stocks) ? marketState.stocks : [];
  const cryptos = Array.isArray(marketState?.cryptos) ? marketState.cryptos : [];

  const xoffsets = [
    0, -1, -2, -3, -4, -5,
    -5, -5, -5, -5, -5,
    -4, -3, -2, -1, 0,
    0, 0, 0, 0,
  ];
  const yoffsets = [
    0, 0, 0, 0, 0, 0,
    -1, -2, -3, -4, -5,
    -5, -5, -5, -5, -5,
    -4, -3, -2, -1
  ];

  const getPawnOffsets = (pos: number) => {
    const posidx = pos % 20;
    const scale = 370;
    const xoff = xoffsets[posidx] * scale;
    const zoff = yoffsets[posidx] * scale;

    return { x: xoff, z: zoff }
  }

  useEffect(() => {
    if (!spline.current) return;

    allPlayers.forEach((p: Player) => {
      const pawnId = p.pawn_id;
      const pawn = spline.current?.findObjectByName(pawnId);
      if (pawn && initPositions.current[pawnId] !== undefined) {
        const offsets = getPawnOffsets(p.position)
        pawn.position.x = initPositions.current[pawnId] + offsets.x;
        pawn.position.z = initPositions.current[pawnId] + offsets.z;
      }
    });
  }, [allPlayers]);

  const onSplineMouseDown = (e: SplineEvent) => {

    const nextField = FIELD.find(f => f.f === e.target.name);
    const pawn = spline.current?.findObjectByName(currentPlayer.pawn_id);

    if (!nextField || !pawn) return;

    if (!observeRef.current) {
      const currentField = selectedFieldRef.current;
      const dist = nextField.d - currentField.d;

      if (dist <= 0) return;
      if (dist > 3) return;

      const obj = spline.current?.findObjectByName(e.target.name);
      const prevObj = spline.current?.findObjectByName(currentField.f);

      if (obj) obj.state = "selected";
      if (prevObj) prevObj.state = "Base State";

      const offsets = getPawnOffsets(nextField.d);
      pawn.position.x = initPositions.current[currentPlayer.pawn_id] + offsets.x;
      pawn.position.z = initPositions.current[currentPlayer.pawn_id] + offsets.z;

      setSelectedField(nextField);
      setSelectedObserveField(nextField);
      setHasMovedThisTurn(true);
      hasMovedThisTurnRef.current = true;
      setObserve(true);
    } else {
      setSelectedObserveField(nextField);
    }

    setShowModal(prev => !prev);

  };


  const handleLeaveGame = () => {
    console.log(currentPlayer.id);
    navigate("/");
  };

  const handleAddAction = (action: Action) => {
    setPendingActions(prev => [...prev, action]);
  };

  const handleEndTurn = () => {
    const ws = getActiveGameWebSocket();
    if (!ws) {
      console.warn("Game WebSocket is missing");
      return;
    }

    console.log("handleEndTurn", { pendingActions })
    setIsWaitingForState(true);

    let stepsTravelled = selectedField.d - (currentPlayer.position || 0);
    if (stepsTravelled < 0) {
      // Assume wraparound
      stepsTravelled = (selectedField.d + FIELD.length) - (currentPlayer.position || 0);
    }

    ws.send({
      type: "move",
      move: {
        steps: stepsTravelled,
        actions: pendingActions
      },
    });

    // Clear pending actions after sending
    setPendingActions([]);
  };

  return (
    <div className="game-container">
      {/* {isWaitingForState && (
        <div className="waiting-overlay">
          <div className="waiting-message">
            <div className="waiting-title">Waiting for turn to end...</div>
            <div className="waiting-subtitle">Please wait for the updated game state.</div>
          </div>
        </div>
      )} */}

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
            {otherPlayers.map((player: Player) => (
              <div
                key={player.id}
                className="other-player-card"
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="player-name">{player.name}</div>
                <div className="player-money">${player.money.toFixed(2)}</div>
                <div className="player-properties">
                  {player.properties.length} properties
                </div>
              </div>
            ))}
          </div>

          <div className="game-actions">
            <button className="action-button" disabled={isWaitingForState} onClick={() => setShowMarkets((v) => !v)}>
              {showMarkets ? "Close Markets" : "Markets"}
            </button>
            <button className="action-button" disabled={isWaitingForState} onClick={handleEndTurn}>
              {isWaitingForState ? "Waiting…" : "End Turn"}
            </button>
          </div>

          {pendingActions.length > 0 && (
            <div className="pending-actions">
              <h3>Pending Actions ({pendingActions.length})</h3>
              <div className="pending-actions-list">
                {pendingActions.map((action, index) => (
                  <div key={index} className="pending-action-item">
                    <span className={`action-type ${action.action_type}`}>
                      {action.action_type.toUpperCase()}
                    </span>
                    <span className="action-details">
                      {action.assets_type} #{action.assets_id} × {action.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="switch-container">
            <p>Move</p>
            <div className="switch">
              <div style={{ transform: !observe ? "translateX(0)" : "translateX(200%)" }} onClick={() => {
                if (isWaitingForState || hasMovedThisTurnRef.current) setObserve(true);
                else setObserve(prev => !prev);
              }} />
            </div>
            <p>Preview</p>
          </div>

        </div>

        <div className="board-container">

          <div className="game-modal" style={{ transform: showModal ? "translateY(0)" : "translateY(100%)" }}>
            <button className="hide-modal-button" aria-label="Hide panel" onClick={() => { setShowModal(prev => !prev) }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div>
              {fieldsData.find(f => f.f === selectedObserveField.f)?.name == "Start" ? (
                <div>
                  <h1>Start</h1>
                  <p>You receive 200 PLN for passing Start!</p>
                </div>
              ) : fieldsData.find(f => f.f === selectedObserveField.f)?.name == "Stockmarket" ? (
                <div className="stock-market-modal">
                  <h1>📈 Stock Market</h1>
                  <p>Trade stocks and watch your wealth grow!</p>
                  <div>
                    <button className="action-button" style={{ marginTop: "1.5em" }} onClick={() => {
                      setShowStockMarketModal(true);
                    }}>💰 Open Stock Market</button>
                  </div>
                </div>
              ) : fieldsData.find(f => f.f === selectedObserveField.f)?.name == "Bank" ? (
                <div>
                  <h1>🏦 Bank - {getGlobalGameState().board[selectedObserveField.d].name}</h1>
                  <p>Manage your finances with our banking services.</p>
                  <div className="game-bank-services">
                    <button
                      className="game-bank-service-btn credit-btn"
                      onClick={() => {
                        setShowBankModal(true);
                      }}
                    >
                      💳 Bank Services
                    </button>
                    {/* <button
                      className="game-bank-service-btn deposit-btn"
                      onClick={() => {
                        setShowBankModal(true);
                      }}
                    >
                      💰 Make Deposit
                    </button>
                    <button
                      className="game-bank-service-btn insurance-btn"
                      onClick={() => {
                        setShowBankModal(true);
                      }}
                    >
                      🛡️ Get Insurance
                    </button> */}
                  </div>
                </div>
              ) : fieldsData.find(f => f.f === selectedObserveField.f)?.name == "Crypto" ? (
                <div>
                  <h1>Crypto Exchange - {getGlobalGameState().board[selectedObserveField.d].name}</h1>
                  <p>You can buy and sell cryptocurrencies here.</p>
                </div>
              ) : fieldsData.find(f => f.f === selectedObserveField.f)?.name == "Estate" ? (
                <div>
                  <h1>Estate - {getGlobalGameState().board[selectedObserveField.d].name}</h1>
                  <p>You can buy and sell properties here.</p>
                </div>
              ) : fieldsData.find(f => f.f === selectedObserveField.f)?.name == "Chance" ? (
                <div>
                  <h1>🎲 Chance</h1>
                  <p>Draw a chance card and see what fate has in store!</p>
                  <div>
                    <button
                      className="game-chance-draw-btn"
                      onClick={() => {
                        setShowChanceModal(true);
                      }}
                    >
                      🎯 Draw Chance Card
                    </button>
                  </div>
                </div>
              ) : fieldsData.find(f => f.f === selectedObserveField.f)?.name == "Bet" ? (
                <div>
                  <h1>Bookmaker</h1>
                  <p>You can place bets here.</p>
                </div>
              ) : fieldsData.find(f => f.f === selectedObserveField.f)?.name == "Tax" ? (
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
                  onLoad={(s) => {
                    spline.current = s;
                    for (let i = 1; i <= 6; i++) {
                      const pawnId = `p${i}-start`;
                      const pawn = s.findObjectByName(pawnId);
                      if (pawn) {
                        initPositions.current[pawnId] = pawn.position.x;
                      }
                    }
                    allPlayers.forEach((p: Player) => {
                      const pawnId = p.pawn_id;
                      const pawn = s.findObjectByName(pawnId);
                      if (pawn && initPositions.current[pawnId] !== undefined) {
                        const offsets = getPawnOffsets(p.position || 0);
                        pawn.position.x = initPositions.current[pawnId] + offsets.x;
                        pawn.position.z = initPositions.current[pawnId] + offsets.z;
                      }
                    });
                  }}
                />
                {isWaitingForState && (
                  <div className="board-blocker">
                    <div className="board-blocker-text">
                      Waiting for turn to end...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>


      <StockMarketModal
        isOpen={showStockMarketModal}
        onClose={() => setShowStockMarketModal(false)}
        stocks={stocks}
        currentPlayer={currentPlayer}
        onAction={handleAddAction}
      />

      <BankModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        currentPlayer={currentPlayer}
        onAction={handleAddAction}
      />

      <ChanceModal
        isOpen={showChanceModal}
        onClose={() => setShowChanceModal(false)}
        chanceCards={getGlobalGameState().cards || []}
        onAction={handleAddAction}
      />
    </div>
  );
}