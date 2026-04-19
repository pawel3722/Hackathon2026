import React from 'react';
import type { ChanceCard, Action } from '../types';
import './ChanceModal.css';

interface ChanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  chanceCards: ChanceCard[];
  onAction: (action: Action) => void;
}

export const ChanceModal: React.FC<ChanceModalProps> = ({
  isOpen,
  onClose,
  chanceCards,
  onAction,
}) => {
  if (!isOpen) return null;

  const handleChooseCard = (card: ChanceCard) => {
    const action: Action = {
      action_type: 'draw_chance',
      assets_type: 'chance',
      assets_id: card.id,
      amount: 1,
    };
    onAction(action);
    onClose();
  };

  return (
    <div className="chance-modal-overlay">
      <div className="chance-modal">
        <div className="chance-modal-header">
          <h2>🎲 Chance Cards</h2>
          <button className="chance-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="chance-modal-content">
          <p>Choose one of the three chance cards:</p>
          <div className="chance-cards-grid">
            {chanceCards.map((card) => (
              <div key={card.id} className="chance-card" onClick={() => handleChooseCard(card)}>
                <div className="chance-card-description">
                  {card.description}
                </div>
                <button
                  className="chance-card-choose-btn"
                >
                  Choose This Card
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};