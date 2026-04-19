import { useState, useMemo, useEffect } from 'react';
import type { Player, Action } from '../types';
import './BankModal.css';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: Player;
  onAction: (action: Action) => void;
}

type BankAction = 'credit' | 'deposit' | 'insurance';

interface BankOption {
  id: number;
  name: string;
  interestRate: number;
  term: number; // in months
  description: string;
}

const CREDIT_OPTIONS: BankOption[] = [
  { id: 1, name: '12 Month Credit', interestRate: 8.5, term: 12, description: 'Low interest, short term' },
  { id: 2, name: '24 Month Credit', interestRate: 9.2, term: 24, description: 'Medium term credit' },
  { id: 3, name: '36 Month Credit', interestRate: 10.1, term: 36, description: 'Long term financing' },
];

const DEPOSIT_OPTIONS: BankOption[] = [
  { id: 4, name: '12 Month Deposit', interestRate: 4.2, term: 12, description: 'Safe short-term savings' },
  { id: 5, name: '24 Month Deposit', interestRate: 4.8, term: 24, description: 'Better rates for longer term' },
  { id: 6, name: '36 Month Deposit', interestRate: 5.5, term: 36, description: 'Highest interest rates' },
];

const INSURANCE_OPTIONS: BankOption[] = [
  { id: 7, name: '12 Month Insurance', interestRate: 2.1, term: 12, description: 'Basic coverage' },
  { id: 8, name: '24 Month Insurance', interestRate: 2.3, term: 24, description: 'Extended protection' },
  { id: 9, name: '36 Month Insurance', interestRate: 2.5, term: 36, description: 'Comprehensive coverage' },
];

export function BankModal({
  isOpen,
  onClose,
  currentPlayer,
  onAction,
}: BankModalProps) {
  const [selectedAction, setSelectedAction] = useState<BankAction>('credit');
  const [selectedOption, setSelectedOption] = useState<BankOption | null>(null);
  const [amount, setAmount] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAction('credit');
      setSelectedOption(null);
      setAmount(1000);
      setError('');
    }
  }, [isOpen]);

  const currentOptions = useMemo(() => {
    switch (selectedAction) {
      case 'credit':
        return CREDIT_OPTIONS;
      case 'deposit':
        return DEPOSIT_OPTIONS;
      case 'insurance':
        return INSURANCE_OPTIONS;
      default:
        return [];
    }
  }, [selectedAction]);

  const calculateMonthlyPayment = (principal: number, rate: number, term: number): number => {
    const monthlyRate = rate / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
  };

  const calculateTotalPayment = (principal: number, rate: number, term: number): number => {
    const monthlyPayment = calculateMonthlyPayment(principal, rate, term);
    return monthlyPayment * term;
  };

  const calculateInterest = (principal: number, rate: number, term: number): number => {
    return calculateTotalPayment(principal, rate, term) - principal;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setAmount(Math.max(0, value));
  };

  const handleConfirm = async () => {
    if (!selectedOption) {
      setError('Please select a banking option');
      return;
    }

    if (amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Validate based on action type
    if (selectedAction === 'credit' && amount > 50000) {
      setError('Maximum credit amount is 50,000 PLN');
      return;
    }

    if (selectedAction === 'deposit' && amount > currentPlayer.money) {
      setError('Insufficient funds for deposit');
      return;
    }

    if (selectedAction === 'insurance' && amount > 10000) {
      setError('Maximum insurance amount is 10,000 PLN');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const action: Action = {
        action_type: 'bank',
        assets_type: selectedAction,
        assets_id: selectedOption.id,
        amount: amount,
      };

      onAction(action);

      // Reset form
      setSelectedOption(null);
      setAmount(1000);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing banking action');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bank-modal-overlay" onClick={onClose}>
      <div className="bank-modal-content" onClick={e => e.stopPropagation()}>
        <div className="bank-modal-header">
          <h2>🏦 Bank Services</h2>
          <button className="bank-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Action Type Tabs */}
        <div className="bank-modal-tabs">
          <button
            className={`tab ${selectedAction === 'credit' ? 'active' : ''}`}
            onClick={() => {
              setSelectedAction('credit');
              setSelectedOption(null);
              setError('');
            }}
          >
            💳 Credit
          </button>
          <button
            className={`tab ${selectedAction === 'deposit' ? 'active' : ''}`}
            onClick={() => {
              setSelectedAction('deposit');
              setSelectedOption(null);
              setError('');
            }}
          >
            💰 Deposit
          </button>
          <button
            className={`tab ${selectedAction === 'insurance' ? 'active' : ''}`}
            onClick={() => {
              setSelectedAction('insurance');
              setSelectedOption(null);
              setError('');
            }}
          >
            🛡️ Insurance
          </button>
        </div>

        {/* Error message */}
        {error && <div className="bank-modal-error">{error}</div>}

        <div className="bank-modal-section">
          {/* Options Selection */}
          <div className="bank-options">
            <h3>Select {selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)} Option</h3>
            <div className="options-grid">
              {currentOptions.map(option => (
                <div
                  key={option.id}
                  className={`option-card ${selectedOption?.id === option.id ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(option)}
                >
                  <h4>{option.name}</h4>
                  <p className="option-description">{option.description}</p>
                  <div className="option-details">
                    <span className="interest-rate">{option.interestRate}% APR</span>
                    <span className="term">{option.term} months</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          {selectedOption && (
            <div className="amount-section">
              <div className="amount-input-group">
                <label htmlFor="bank-amount">
                  {selectedAction === 'credit' ? 'Credit Amount' :
                   selectedAction === 'deposit' ? 'Deposit Amount' : 'Insurance Amount'}:
                </label>
                <input
                  id="bank-amount"
                  type="number"
                  min="100"
                  max={selectedAction === 'credit' ? '50000' :
                       selectedAction === 'deposit' ? currentPlayer.money.toString() : '10000'}
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                />
                <span className="currency">PLN</span>
              </div>

              {/* Calculation Display */}
              <div className="calculation-display">
                {selectedAction === 'credit' && (
                  <>
                    <div className="calc-row">
                      <span>Monthly Payment:</span>
                      <span className="calc-value">
                        {calculateMonthlyPayment(amount, selectedOption.interestRate, selectedOption.term).toFixed(2)} PLN
                      </span>
                    </div>
                    <div className="calc-row">
                      <span>Total Interest:</span>
                      <span className="calc-value">
                        {calculateInterest(amount, selectedOption.interestRate, selectedOption.term).toFixed(2)} PLN
                      </span>
                    </div>
                    <div className="calc-row total">
                      <span>Total Amount:</span>
                      <span className="calc-value">
                        {calculateTotalPayment(amount, selectedOption.interestRate, selectedOption.term).toFixed(2)} PLN
                      </span>
                    </div>
                  </>
                )}

                {selectedAction === 'deposit' && (
                  <>
                    <div className="calc-row">
                      <span>Interest Earned:</span>
                      <span className="calc-value profit">
                        {((amount * selectedOption.interestRate * selectedOption.term) / (100 * 12)).toFixed(2)} PLN
                      </span>
                    </div>
                    <div className="calc-row total">
                      <span>Total Return:</span>
                      <span className="calc-value profit">
                        {(amount + (amount * selectedOption.interestRate * selectedOption.term) / (100 * 12)).toFixed(2)} PLN
                      </span>
                    </div>
                  </>
                )}

                {selectedAction === 'insurance' && (
                  <>
                    <div className="calc-row">
                      <span>Monthly Premium:</span>
                      <span className="calc-value">
                        {((amount * selectedOption.interestRate) / 100 / 12).toFixed(2)} PLN
                      </span>
                    </div>
                    <div className="calc-row total">
                      <span>Total Premium:</span>
                      <span className="calc-value">
                        {((amount * selectedOption.interestRate * selectedOption.term) / (100 * 12)).toFixed(2)} PLN
                      </span>
                    </div>
                  </>
                )}
              </div>

              <button
                className="bank-confirm"
                onClick={handleConfirm}
                disabled={isLoading || amount <= 0}
              >
                {isLoading ? 'Processing...' : `Confirm ${selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}