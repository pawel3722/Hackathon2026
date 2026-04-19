import { useState } from 'react';
import type { Stock, Player, Action } from '../types';
import { PriceChart } from './PriceChart';
import './StockMarketModal.css';

interface StockMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: Stock[];
  currentPlayer: Player;
  initialMode?: 'buy' | 'sell';
  onAction: (action: Action) => void;
}

export function StockMarketModal({
  isOpen,
  onClose,
  stocks,
  onAction,
}: StockMarketModalProps) {
  const [tradeAmounts, setTradeAmounts] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  return (
    <div className="stock-market-overlay" onClick={onClose}>
      <div className="stock-market-content" onClick={(e) => e.stopPropagation()}>
        <button className="stock-market-close-icon" onClick={onClose}>✕</button>
        
        {stocks.length === 0 ? (
        <div className="markets-empty">No market data yet.</div>
      ) : (
        <div className="markets-section">
          <h2 className="markets-title" style={{ textAlign: "center", fontSize: "1.5rem" }}>Stocks</h2>
          <div className="markets-grid">
            {stocks.map((s: any) => {
              const sellPrice = Number(s.price);
              const buyPrice = sellPrice * 1.005;
              const amount = tradeAmounts[s.id] || 1;
              return (
                <div key={`stock-${s.id}`} className="market-card">
                  <div className="market-card-title" style={{ textAlign: "center" }}>{s.name} - {sellPrice.toFixed(2)} PLN</div>
                  <PriceChart priceHistory={Array.isArray(s.price_history) ? s.price_history : [s.price]} />
                  <div className="trade-controls">
                    <div className="qty-row">
                      <label>Qty:</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={amount} 
                        onChange={(e) => setTradeAmounts({...tradeAmounts, [s.id]: Math.max(1, parseInt(e.target.value) || 1)})}
                      />
                    </div>
                    <div className="action-buttons">
                      <button 
                        className="buy-button"
                        onClick={() => onAction({ action_type: 'buy', assets_type: 'stock', assets_id: s.id, amount })}
                      >
                        Buy @ {buyPrice.toFixed(2)} PLN
                      </button>
                      <button 
                        className="sell-button"
                        onClick={() => onAction({ action_type: 'sell', assets_type: 'stock', assets_id: s.id, amount })}
                      >
                        Sell @ {sellPrice.toFixed(2)} PLN
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}