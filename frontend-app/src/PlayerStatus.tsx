import "./PlayerStatus.css";
import type { Player } from "./types";

interface PlayerStatusProps {
  player: Player;
  isCurrentPlayer?: boolean;
  onClose?: () => void;
}

export default function PlayerStatus({ player, isCurrentPlayer = false, onClose }: PlayerStatusProps) {
  return (
    <div className="player-status">
      <div className="player-status-header">
        <h3>{isCurrentPlayer ? "Twój status" : player.name}</h3>
        {onClose && (
          <button className="close-button" onClick={onClose} title="Zamknij">
            ✕
          </button>
        )}
      </div>

      <div className="player-stats">
        <div className="stat-item">
          <span className="stat-label">Pieniądze:</span>
          <span className="stat-value">${player.money}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pozycja:</span>
          <span className="stat-value">{player.position}</span>
        </div>
      </div>

      <div className="properties-section">
        <h4>Własności ({player.properties.length})</h4>
        {player.properties.length > 0 ? (
          <ul className="properties-list">
            {player.properties.map((property, index) => (
              <li key={index} className="property-item">
                {property.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-properties">Brak posiadanych nieruchomości</p>
        )}
      </div>
    </div>
  );
}
