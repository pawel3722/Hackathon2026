import { useState, useMemo, useEffect } from 'react';
import type { Crypto, Player, Action } from '../types';
import './CryptoExchangeModal.css';

interface CryptoExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cryptos: Crypto[];
  currentPlayer: Player;
  initialMode?: 'buy' | 'sell';
  onAction: (action: Action) => void;
}

type Mode = 'buy' | 'sell';

export function CryptoExchangeModal({
  isOpen,
  onClose,
  cryptos,
  currentPlayer,
  initialMode = 'buy',
  onAction,
}: CryptoExchangeModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [selectedCryptoId, setSelectedCryptoId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Update mode when isOpen or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Get selected crypto details
  const selectedCrypto = useMemo(
    () => cryptos.find(c => c.id === selectedCryptoId),
    [selectedCryptoId, cryptos]
  );

  // Get owned cryptos for sell mode
  const ownedCryptos = useMemo(() => {
    return currentPlayer.cryptos
      .map(share => {
        const cryptoInfo = cryptos.find(c => c.id === share.crypto.id);
        if (!cryptoInfo) return undefined;
        return {
          ...cryptoInfo,
          ownedQuantity: share.quantity,
          purchasePrice: share.purchase_price,
        };
      })
      .filter((crypto): crypto is Crypto & { ownedQuantity: number; purchasePrice: number } =>
        crypto !== undefined
      );
  }, [currentPlayer.cryptos, cryptos]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedCrypto) return 0;
    return selectedCrypto.price * quantity;
  }, [selectedCrypto, quantity]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, value));
  };

  const handleBuyCrypto = async () => {
    if (!selectedCrypto) {
      setError('Please select a crypto');
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
        assets_type: 'crypto',
        assets_id: selectedCrypto.id,
        amount: quantity,
      };

      // Add to pending actions
      onAction(action);

      // Reset form after adding action
      setSelectedCryptoId(null);
      setQuantity(1);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error while buying crypto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellCrypto = async () => {
    if (!selectedCrypto) {
      setError('Please select a crypto');
      return;
    }

    const ownedCrypto = currentPlayer.cryptos.find(c => c.crypto.id === selectedCrypto.id);
    if (!ownedCrypto || quantity > ownedCrypto.quantity) {
      setError('Insufficient crypto quantity');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create action object
      const action: Action = {
        action_type: 'sell',
        assets_type: 'crypto',
        assets_id: selectedCrypto.id,
        amount: quantity,
      };

      // Add to pending actions
      onAction(action);

      // Reset form after adding action
      setSelectedCryptoId(null);
      setQuantity(1);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error while selling crypto');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="crypto-exchange-modal-overlay" onClick={onClose}>
      <div className="crypto-exchange-modal-content" onClick={e => e.stopPropagation()}>
        <div className="crypto-exchange-header">
          <h2>Crypto Exchange</h2>
          <button className="crypto-exchange-close" onClick={onClose}>✕</button>
        </div>

        {/* Mode Tabs */}
        <div className="crypto-exchange-tabs">
          <button
            className={`tab ${mode === 'buy' ? 'active' : ''}`}
            onClick={() => {
              setMode('buy');
              setError('');
              setSelectedCryptoId(null);
              setQuantity(1);
            }}
          >
            Buy Crypto
          </button>
          <button
            className={`tab ${mode === 'sell' ? 'active' : ''}`}
            onClick={() => {
              setMode('sell');
              setError('');
              setSelectedCryptoId(null);
              setQuantity(1);
            }}
          >
            Sell Crypto
          </button>
        </div>

        {/* Error message */}
        {error && <div className="crypto-exchange-error">{error}</div>}

        {/* Buy Mode */}
        {mode === 'buy' && (
          <div className="crypto-exchange-section">
            <div className="crypto-exchange-form-group">
              <label htmlFor="buy-crypto">Select cryptocurrency:</label>
              <select
                id="buy-crypto"
                value={selectedCryptoId || ''}
                onChange={e => {
                  setSelectedCryptoId(e.target.value ? parseInt(e.target.value) : null);
                  setQuantity(1);
                }}
              >
                <option value="">-- Select --</option>
                {cryptos.map(crypto => (
                  <option key={crypto.id} value={crypto.id}>
                    {crypto.ticker} - {crypto.name} (${crypto.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {selectedCrypto && (
              <>
                <div className="crypto-exchange-form-group">
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

                <div className="crypto-exchange-details">
                  <div className="detail-row">
                    <span>Unit price:</span>
                    <span className="detail-value">${selectedCrypto.price.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Quantity:</span>
                    <span className="detail-value">{quantity}</span>
                  </div>
                  <div className="detail-row total">
                    <span>Total price:</span>
                    <span className="detail-value">{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Your money:</span>
                    <span className={`detail-value ${totalPrice > currentPlayer.money ? 'insufficient' : ''}`}>
                      ${currentPlayer.money.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  className="crypto-exchange-confirm"
                  onClick={handleBuyCrypto}
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
          <div className="crypto-exchange-section">
            {ownedCryptos.length === 0 ? (
              <p className="crypto-exchange-no-crypto">You don't own any cryptocurrency</p>
            ) : (
              <>
                <div className="crypto-exchange-form-group">
                  <label htmlFor="sell-crypto">Select crypto to sell:</label>
                  <select
                    id="sell-crypto"
                    value={selectedCryptoId || ''}
                    onChange={e => {
                      setSelectedCryptoId(e.target.value ? parseInt(e.target.value) : null);
                      setQuantity(1);
                    }}
                  >
                    <option value="">-- Select --</option>
                    {ownedCryptos.map(crypto => (
                      <option key={crypto.id} value={crypto.id}>
                        {crypto.ticker} - {crypto.name} (Owned: {crypto.ownedQuantity})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCrypto && (
                  <>
                    <div className="crypto-exchange-form-group">
                      <label htmlFor="sell-quantity">Quantity to sell:</label>
                      <input
                        id="sell-quantity"
                        className="inputbrzydki"
                        type="number"
                        min="1"
                        max={currentPlayer.cryptos.find(c => c.crypto.id === selectedCrypto.id)?.quantity || 1}
                        value={quantity}
                        onChange={handleQuantityChange}
                      />
                    </div>

                    <div className="crypto-exchange-details">
                      <div className="detail-row">
                        <span>Unit price:</span>
                        <span className="detail-value">${selectedCrypto.price.toFixed(2)}</span>
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
                          {currentPlayer.cryptos.find(c => c.crypto.id === selectedCrypto.id)?.quantity || 0}
                        </span>
                      </div>
                    </div>

                    <button
                      className="crypto-exchange-confirm"
                      onClick={handleSellCrypto}
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
