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
        <h3>{isCurrentPlayer ? "Your status" : player.name}</h3>
        {onClose && (
          <button className="close-button" onClick={onClose} title="Close">
            ✕
          </button>
        )}
      </div>

      <div className="player-stats">
        <div className="stat-item">
          <span className="stat-label">Money:</span>
          <span className="stat-value">${player.money.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Position:</span>
          <span className="stat-value">{player.position}</span>
        </div>
      </div>

      <div className="properties-section">
        <h4>Stock ({player.stocks.length})</h4>
        {player.stocks.length > 0 ? (
          <ul className="properties-list">
            {player.stocks.map((stock, index) => (
              <li key={index} className="property-item">
                {stock.stock.ticker} — quantity: {stock.quantity}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-properties">No stocks available</p>
        )}
      </div>

      <div className="properties-section">
        <h4>Credits ({player.credits.length})</h4>
        {player.credits.length > 0 ? (
          <ul className="properties-list">
            {player.credits.map((credit, index) => (
              <li key={index} className="property-item">
                Duration: {credit.remaining_payments} payments, payment: ${credit.amount.toFixed(2)} PLN
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-properties">No credits available</p>
        )}
      </div>

      <div className="properties-section">
        <h4>Deposits ({player.deposits.length})</h4>
        {player.deposits.length > 0 ? (
          <ul className="properties-list">
            {player.deposits.map((deposit, index) => {
              const returnValue = (deposit.amount * (1 + deposit.interest_rate)).toFixed(2);
              return (
                <li key={index} className="property-item">
                  Duration: {deposit.maturity_date}, return value: ${returnValue} PLN
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="no-properties">No deposits available</p>
        )}
      </div>
    </div>
  );
}
