<<<<<<< HEAD
import { useState, useMemo, useEffect } from 'react';
import type { Stock, Player, Action } from '../types';
=======
import { useState } from 'react';
import type { Stock, Player, Action } from '../types';
import { PriceChart } from './PriceChart';
>>>>>>> 970b82635ee94d7f5ff2ea6a6a9e6cde89ec9790
import './StockMarketModal.css';

interface StockMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: Stock[];
  currentPlayer: Player;
  initialMode?: 'buy' | 'sell';
  onAction: (action: Action) => void;
}

<<<<<<< HEAD
type Mode = 'buy' | 'sell';

=======
>>>>>>> 970b82635ee94d7f5ff2ea6a6a9e6cde89ec9790
export function StockMarketModal({
  isOpen,
  onClose,
  stocks,
<<<<<<< HEAD
  currentPlayer,
  initialMode = 'buy',
  onAction,
}: StockMarketModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Update mode when isOpen or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Get selected stock details
  const selectedStock = useMemo(
    () => stocks.find(s => s.id === selectedStockId),
    [selectedStockId, stocks]
  );

  // Get owned stocks for sell mode
  const ownedStocks = useMemo(() => {
    return currentPlayer.stocks
      .map(share => ({
        ...stocks.find(s => s.id === share.stock_id),
        ownedQuantity: share.quantity,
        purchasePrice: share.purchase_price,
      }))
      .filter((stock): stock is Stock & { ownedQuantity: number; purchasePrice: number } =>
        stock !== undefined
      );
  }, [currentPlayer.stocks, stocks]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedStock) return 0;
    return selectedStock.price * quantity;
  }, [selectedStock, quantity]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, value));
  };

  const handleBuyStock = async () => {
    if (!selectedStock) {
      setError('Proszę wybrać akcję');
      return;
    }

    if (totalPrice > currentPlayer.money) {
      setError('Niewystarczające środki');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create action object
      const action: Action = {
        action_type: 'buy',
        assets_type: 'stock',
        assets_id: selectedStock.id,
        amount: quantity,
      };

      // Add to pending actions
      onAction(action);

      // Reset form after adding action
      setSelectedStockId(null);
      setQuantity(1);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd podczas kupowania akcji');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellStock = async () => {
    if (!selectedStock) {
      setError('Proszę wybrać akcję');
      return;
    }

    const ownedStock = currentPlayer.stocks.find(s => s.stock_id === selectedStock.id);
    if (!ownedStock || quantity > ownedStock.quantity) {
      setError('Niewystarczająca ilość akcji');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create action object
      const action: Action = {
        action_type: 'sell',
        assets_type: 'stock',
        assets_id: selectedStock.id,
        amount: quantity,
      };

      // Add to pending actions
      onAction(action);

      // Reset form after adding action
      setSelectedStockId(null);
      setQuantity(1);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd podczas sprzedawania akcji');
    } finally {
      setIsLoading(false);
    }
  };
=======
  onAction,
}: StockMarketModalProps) {
  const [tradeAmounts, setTradeAmounts] = useState<Record<string, number>>({});
>>>>>>> 970b82635ee94d7f5ff2ea6a6a9e6cde89ec9790

  if (!isOpen) return null;

  return (
<<<<<<< HEAD
    <div className="stock-market-modal-overlay" onClick={onClose}>
      <div className="stock-market-modal-content" onClick={e => e.stopPropagation()}>
        <div className="stock-market-header">
          <h2>Rynek Akcji</h2>
          <button className="stock-market-close" onClick={onClose}>✕</button>
        </div>

        {/* Mode Tabs */}
        <div className="stock-market-tabs">
          <button
            className={`tab ${mode === 'buy' ? 'active' : ''}`}
            onClick={() => {
              setMode('buy');
              setError('');
              setSelectedStockId(null);
              setQuantity(1);
            }}
          >
            Kup Akcje
          </button>
          <button
            className={`tab ${mode === 'sell' ? 'active' : ''}`}
            onClick={() => {
              setMode('sell');
              setError('');
              setSelectedStockId(null);
              setQuantity(1);
            }}
          >
            Sprzedaj Akcje
          </button>
        </div>

        {/* Error message */}
        {error && <div className="stock-market-error">{error}</div>}

        {/* Buy Mode */}
        {mode === 'buy' && (
          <div className="stock-market-section">
            <div className="stock-market-form-group">
              <label htmlFor="buy-stock">Wybierz akcję:</label>
              <select
                id="buy-stock"
                value={selectedStockId || ''}
                onChange={e => {
                  setSelectedStockId(e.target.value ? parseInt(e.target.value) : null);
                  setQuantity(1);
                }}
              >
                <option value="">-- Wybierz --</option>
                {stocks.map(stock => (
                  <option key={stock.id} value={stock.id}>
                    {stock.ticker} - {stock.name} (${stock.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {selectedStock && (
              <>
                <div className="stock-market-form-group">
                  <label htmlFor="buy-quantity">Ilość:</label>
                  <input
                    id="buy-quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                  />
                </div>

                <div className="stock-market-details">
                  <div className="detail-row">
                    <span>Cena jednostkowa:</span>
                    <span className="detail-value">${selectedStock.price.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Ilość:</span>
                    <span className="detail-value">{quantity}</span>
                  </div>
                  <div className="detail-row total">
                    <span>Cena całkowita:</span>
                    <span className="detail-value">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Twoje pieniądze:</span>
                    <span className={`detail-value ${totalPrice > currentPlayer.money ? 'insufficient' : ''}`}>
                      ${currentPlayer.money.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  className="stock-market-confirm"
                  onClick={handleBuyStock}
                  disabled={isLoading || totalPrice > currentPlayer.money}
                >
                  {isLoading ? 'Przetwarzanie...' : 'Potwierdź Zakup'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Sell Mode */}
        {mode === 'sell' && (
          <div className="stock-market-section">
            {ownedStocks.length === 0 ? (
              <p className="no-stocks">Nie posiadasz żadnych akcji</p>
            ) : (
              <>
                <div className="stock-market-form-group">
                  <label htmlFor="sell-stock">Wybierz akcję do sprzedaży:</label>
                  <select
                    id="sell-stock"
                    value={selectedStockId || ''}
                    onChange={e => {
                      setSelectedStockId(e.target.value ? parseInt(e.target.value) : null);
                      setQuantity(1);
                    }}
                  >
                    <option value="">-- Wybierz --</option>
                    {ownedStocks.map(stock => (
                      <option key={stock.id} value={stock.id}>
                        {stock.ticker} - {stock.name} (Posiadasz: {stock.ownedQuantity})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStock && (
                  <>
                    <div className="stock-market-form-group">
                      <label htmlFor="sell-quantity">Ilość do sprzedaży:</label>
                      <input
                        id="sell-quantity"
                        type="number"
                        min="1"
                        max={currentPlayer.stocks.find(s => s.stock_id === selectedStock.id)?.quantity || 1}
                        value={quantity}
                        onChange={handleQuantityChange}
                      />
                    </div>

                    <div className="stock-market-details">
                      <div className="detail-row">
                        <span>Cena jednostkowa:</span>
                        <span className="detail-value">${selectedStock.price.toFixed(2)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Ilość do sprzedaży:</span>
                        <span className="detail-value">{quantity}</span>
                      </div>
                      <div className="detail-row total">
                        <span>Otrzymasz:</span>
                        <span className="detail-value profit">${totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Posiadasz:</span>
                        <span className="detail-value">
                          {currentPlayer.stocks.find(s => s.stock_id === selectedStock.id)?.quantity || 0}
                        </span>
                      </div>
                    </div>

                    <button
                      className="stock-market-confirm"
                      onClick={handleSellStock}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Przetwarzanie...' : 'Potwierdź Sprzedaż'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
=======
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
>>>>>>> 970b82635ee94d7f5ff2ea6a6a9e6cde89ec9790
      </div>
    </div>
  );
}