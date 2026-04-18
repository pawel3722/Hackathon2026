import { useEffect, useState } from "react";
import "./WaitingScreen.css";

interface WaitingScreenProps {
    playerName: string;
    gameId: string;
    difficulty: string;
    numPlayers: number;
    isCreator: boolean;
    onGameStart: () => void;
    onCancel: () => void;
}

export default function WaitingScreen({
    playerName,
    gameId,
    difficulty,
    numPlayers,
    isCreator,
    onGameStart,
    onCancel,
}: WaitingScreenProps) {
    const [connectedPlayers, setConnectedPlayers] = useState<number>(1);
    const [playersList, setPlayersList] = useState<string[]>([playerName]);
    const [isChecking, setIsChecking] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);
    const gameLink = `${window.location.origin}/game/${gameId}`;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(gameLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    };

    useEffect(() => {
        // Mock server polling for development
        const interval = setInterval(() => {
            setIsChecking(true);

            // Simulate server response delay
            setTimeout(() => {
                setIsChecking(false);

                // Mock: randomly add players for demo purposes
                if (connectedPlayers < numPlayers && Math.random() > 0.7) {
                    const newCount = connectedPlayers + 1;
                    setConnectedPlayers(newCount);

                    // Add mock player names
                    const mockNames = [
                        "Gracz2",
                        "Gracz3",
                        "Gracz4",
                        "Gracz5",
                        "Gracz6",
                    ];
                    setPlayersList((prev) => [
                        ...prev,
                        mockNames[prev.length - 1] || `Gracz${prev.length + 1}`,
                    ]);

                    // Game will start when creator clicks the start button
                }
            }, 500);
        }, 3000);

        return () => clearInterval(interval);
    }, [connectedPlayers, numPlayers, onGameStart]);

    return (
        <div className="waiting-container">
            <div className="waiting-card">
                <h1 className="waiting-title">Oczekiwanie na graczy</h1>

                <div className="waiting-content">
                    <div className="waiting-left">
                        <div className="game-info">
                            <div className="info-item">
                                <span className="info-label">ID gry:</span>
                                <span className="info-value">{gameId}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Trudność:</span>
                                <span className="info-value capitalize">{difficulty}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Gracze:</span>
                                <span className="info-value">
                                    {connectedPlayers}/{numPlayers}
                                </span>
                            </div>
                        </div>

                        {isCreator && (
                            <div className="share-link-section">
                                <p className="share-link-label">Podziel się linkiem:</p>
                                <div className="share-link-container">
                                    <input
                                        type="text"
                                        value={gameLink}
                                        readOnly
                                        className="share-link-input"
                                    />
                                    <button onClick={copyToClipboard} className="copy-button" title="Kopiuj link">
                                        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                                {copied && <p className="copied-message">Link skopiowany!</p>}
                            </div>
                        )}
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
                                {Array.from({ length: numPlayers - connectedPlayers }).map(
                                    (_, index) => (
                                        <div key={`empty-${index}`} className="player-item empty">
                                            <div className="player-avatar placeholder">?</div>
                                            <span className="player-name placeholder">Czekam...</span>
                                            <span className="player-null-badge"></span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="status-section">
                    <p className="status-message">
                        {connectedPlayers === numPlayers
                            ? isCreator
                                ? "Wszyscy dołączyli! Kliknij 'Rozpocznij', aby zacząć grę."
                                : "Wszyscy dołączyli! Czekaj na rozpoczęcie gry przez gospodarza."
                            : `Czekam na ${numPlayers - connectedPlayers} ${numPlayers - connectedPlayers === 1 ? "gracza" : "graczy"
                            }`}
                    </p>
                    {isChecking && <p className="checking-status">Sprawdzanie...</p>}
                </div>
                <div className="action-buttons">
                    {isCreator && (
                        <button
                            className="button button-start"
                            onClick={onGameStart}
                            disabled={connectedPlayers !== numPlayers}
                        >
                            Rozpocznij
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
