import { useState, useMemo, useEffect } from 'react';
import type { Stock, Player, Action } from '../types';
import './StockMarketModal.css';

interface StockMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: Stock[];
  currentPlayer: Player;
  initialMode?: 'buy' | 'sell';
  onAction: (action: Action) => void;
}

type Mode = 'buy' | 'sell';

export function StockMarketModal({
  isOpen,
  onClose,
  stocks,
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
        ...stocks.find(s => s.id === share.stock.id),
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
      setError('Please select a stock');
      return;
    }

    if (totalPrice > currentPlayer.money) {
      setError('Insufficient funds');
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
      setError(err instanceof Error ? err.message : 'Error while buying stock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellStock = async () => {
    if (!selectedStock) {
      setError('Please select a stock');
      return;
    }

    const ownedStock = currentPlayer.stocks.find(s => s.stock.id === selectedStock.id);
    if (!ownedStock || quantity > ownedStock.quantity) {
      setError('Insufficient stock quantity');
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
      setError(err instanceof Error ? err.message : 'Error while selling stock');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="stock-market-modal-overlay" onClick={onClose}>
      <div className="stock-market-modal-content" onClick={e => e.stopPropagation()}>
        <div className="stock-market-header">
          <h2>Stock Market</h2>
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
            Buy Stocks
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
            Sell Stocks
          </button>
        </div>

        {/* Error message */}
        {error && <div className="stock-market-error">{error}</div>}

        {/* Buy Mode */}
        {mode === 'buy' && (
          <div className="stock-market-section">
            <div className="stock-market-form-group">
              <label htmlFor="buy-stock">Select stock:</label>
              <select
                id="buy-stock"
                value={selectedStockId || ''}
                onChange={e => {
                  setSelectedStockId(e.target.value ? parseInt(e.target.value) : null);
                  setQuantity(1);
                }}
              >
                <option value="">-- Select --</option>
                {stocks.map(stock => (
                  <option key={stock.id} value={stock.id}>
                    {stock.ticker} - {stock.name} ({stock.price.toFixed(2)} PLN)
                  </option>
                ))}
              </select>
            </div>

            {selectedStock && (
              <>
                <div className="stock-market-form-group">
                  <label htmlFor="buy-quantity">Quantity:</label>
                  <input
                    id="buy-quantity"
                    className="inputbrzydki"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                  />
                </div>

                <div className="stock-market-details">
                  <div className="detail-row">
                    <span>Unit price:</span>
                    <span className="detail-value">{selectedStock.price.toFixed(2)} PLN</span>
                  </div>
                  <div className="detail-row">
                    <span>Quantity:</span>
                    <span className="detail-value">{quantity}</span>
                  </div>
                  <div className="detail-row total">
                    <span>Total price:</span>
                    <span className="detail-value">{totalPrice.toFixed(2)} PLN</span>
                  </div>
                  <div className="detail-row">
                    <span>Your money:</span>
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
                  {isLoading ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Sell Mode */}
        {mode === 'sell' && (
          <div className="stock-market-section">
            {ownedStocks.length === 0 ? (
              <p className="no-stocks">You don't own any stocks</p>
            ) : (
              <>
                <div className="stock-market-form-group">
                  <label htmlFor="sell-stock">Select stock to sell:</label>
                  <select
                    id="sell-stock"
                    value={selectedStockId || ''}
                    onChange={e => {
                      setSelectedStockId(e.target.value ? parseInt(e.target.value) : null);
                      setQuantity(1);
                    }}
                  >
                    <option value="">-- Select --</option>
                    {ownedStocks.map(stock => (
                      <option key={stock.id} value={stock.id}>
                        {stock.ticker} - {stock.name} (Owned: {stock.ownedQuantity})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStock && (
                  <>
                    <div className="stock-market-form-group">
                      <label htmlFor="sell-quantity">Quantity to sell:</label>
                      <input
                        id="sell-quantity"
                        type="number"
                        min="1"
                        max={currentPlayer.stocks.find(s => s.stock.id === selectedStock.id)?.quantity || 1}
                        value={quantity}
                        onChange={handleQuantityChange}
                      />
                    </div>

                    <div className="stock-market-details">
                      <div className="detail-row">
                        <span>Unit price:</span>
                        <span className="detail-value">${selectedStock.price.toFixed(2)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Quantity to sell:</span>
                        <span className="detail-value">{quantity}</span>
                      </div>
                      <div className="detail-row total">
                        <span>You will receive:</span>
                        <span className="detail-value profit">${totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="detail-row">
                        <span>You own:</span>
                        <span className="detail-value">
                          {currentPlayer.stocks.find(s => s.stock.id === selectedStock.id)?.quantity || 0}
                        </span>
                      </div>
                    </div>

                    <button
                      className="stock-market-confirm"
                      onClick={handleSellStock}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Confirm Sale'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}