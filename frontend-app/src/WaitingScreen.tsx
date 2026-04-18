import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GameWebSocket } from "./api";
import { getOrCreateGameWebSocket } from "./websocketBridge";
import "./WaitingScreen.css";

interface WaitingScreenProps {
    playerName: string;
    playerId: string;
    gameId: string;
    difficulty: string;
    isCreator: boolean;
    onCancel: () => void;
}

export default function WaitingScreen({
    playerName,
    playerId,
    gameId,
    difficulty,
    isCreator,
    onCancel,
}: WaitingScreenProps) {
    const navigate = useNavigate();
    const wsRef = useRef<GameWebSocket | null>(null);
    const [connectedPlayers, setConnectedPlayers] = useState<number>(1);
    const [playersList, setPlayersList] = useState<string[]>([playerName]);
    const [copied, setCopied] = useState<boolean>(false);
    const [isStarting, setIsStarting] = useState<boolean>(false);
    const lobbyCode = gameId;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(lobbyCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    };

    useEffect(() => {
        const effectivePlayerId = playerId || localStorage.getItem('playerId');

        if (!lobbyCode || !effectivePlayerId) {
            return;
        }

        const ws = getOrCreateGameWebSocket(
            lobbyCode,
            effectivePlayerId,
            (data: any) => {
                if (data.type === 'lobby_update' && data.users) {
                    setConnectedPlayers(data.users.length);
                    setPlayersList(data.users.map((user: any) => user.name));
                }

                if (data.type === 'game_state_update' && data.game_state) {
                    setConnectedPlayers(data.game_state.players.length);
                    setPlayersList(data.game_state.players.map((player: any) => player.name));
                }

                if (data.type === 'player_joined' && data.player) {
                    setPlayersList((prev) => [...prev, data.player.name]);
                    setConnectedPlayers((prev) => prev + 1);
                }

                if (data.type === 'game_started') {
                    navigate(`/game/${lobbyCode}`, {
                        state: {
                            gameReady: true,
                            playerId: effectivePlayerId,
                        },
                    });
                }
            },
            (error: Event) => {
                console.error('WebSocket error:', error);
            },
            () => {
                console.log('Lobby WebSocket disconnected');
            }
        );

        wsRef.current = ws;

        return () => {
            if (wsRef.current === ws) {
                wsRef.current = null;
            }
        };
    }, [lobbyCode, playerId, navigate]);

    return (
        <div className="waiting-container">
            <div className="waiting-card">
                <h1 className="waiting-title">Oczekiwanie na graczy</h1>

                <div className="waiting-content">
                    <div className="waiting-left">
                        <div className="waiting-game-info">
                            <div className="waiting-info-item">
                                <span className="waiting-info-label">Szczegóły gry:</span>
                                {/* <span className="waiting-info-value">{gameId}</span> */}
                            </div>
                            <div className="waiting-info-item">
                                <span className="waiting-info-label">Trudność:</span>
                                <span className="waiting-info-value capitalize">{difficulty}</span>
                            </div>
                            <div className="waiting-info-item">
                                <span className="waiting-info-label">Gracze:</span>
                                <span className="waiting-info-value">
                                    {connectedPlayers}
                                </span>
                            </div>
                        </div>


                        <div className="share-link-section">
                            <p className="share-link-label">Kod lobby:</p>
                            <div className="share-link-container">
                                <input
                                    type="text"
                                    value={lobbyCode}
                                    readOnly
                                    className="share-link-input"
                                />
                                <button onClick={copyToClipboard} className="copy-button" title="Kopiuj kod">
                                    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                            {copied && <p className="copied-message">Kod skopiowany!</p>}
                            <p className="share-link-hint">Przekaż ten kod innym graczom, aby mogli dołączyć.</p>
                        </div>

                    </div>

                    <div className="waiting-right">
                        <div className="players-section">
                            <h2 className="players-title">Gracze</h2>
                            <div className="players-list">
                                {playersList.map((player, index) => (
                                    <div key={index} className="player-item">
                                        <div className="player-avatar">{player.charAt(0).toUpperCase()}</div>
                                        <span className="player-name">{player}</span>
                                        {index === 0 && <span className="player-badge">Host</span>}
                                        {index !== 0 && <span className="player-null-badge"></span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="status-section">
                    <p className="status-message">
                        {isCreator
                            ? "Możesz rozpocząć grę z obecnymi graczami. Kliknij 'Rozpocznij'."
                            : "Czekaj, aż gospodarz rozpocznie grę."}
                    </p>
                </div>
                <div className="action-buttons">
                    {isCreator && (
                        <button
                            className="button button-start"
                            onClick={() => {
                                if (!wsRef.current) {
                                    console.warn('WebSocket is not ready yet');
                                    return;
                                }

                                setIsStarting(true);
                                wsRef.current.send({ type: 'start' });
                            }}
                            disabled={connectedPlayers < 1 || isStarting}
                        >
                            {isStarting ? 'Rozpoczynanie...' : 'Rozpocznij'}
                        </button>
                    )}

                    <button className="button button-cancel" onClick={onCancel}>
                        Anuluj
                    </button>
                </div>
            </div>
        </div>
    );
}
