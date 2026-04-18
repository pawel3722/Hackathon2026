import numpy as np
import models

REGIME_STATES = ['bull', 'bear']
STOCK_REGIME = "bull"
CRYPTO_REGIME = "bull"

stock_regime_transition = {
    'bull': [0.84, 0.16],
    'bear': [0.28, 0.72]
}

stock_regime_effect = {
    'bull': {'growth_shift': 0.005, 'risk_multiplier': 0.90},
    'bear': {'growth_shift': -0.008, 'risk_multiplier': 1.15}
}

crypto_regime_transition = {
    'bull': [0.78, 0.22],
    'bear': [0.35, 0.65]
}

crypto_regime_effect = {
    'bull': {'growth_shift': 0.01, 'risk_multiplier': 0.95},
    'bear': {'growth_shift': -0.012, 'risk_multiplier': 1.25}
}

# Stability controls to keep game dynamics realistic and avoid numerical explosions
MAX_STOCK_TURN_RETURN = 0.40
MIN_STOCK_TURN_RETURN = -0.30
MAX_CRYPTO_TURN_RETURN = 2.00
MIN_CRYPTO_TURN_RETURN = -0.60
MAX_REBOUND = 0.18
MAX_PRICE = 1e6
MIN_PRICE = 0.01

def next_regime(current_regime, rng):
    global STOCK_REGIME, CRYPTO_REGIME
    STOCK_REGIME = rng.choice(REGIME_STATES, p=stock_regime_transition[current_regime])
    CRYPTO_REGIME = rng.choice(REGIME_STATES, p=crypto_regime_transition[current_regime])

def bounded_t_shock(df, lower=-3.0, upper=3.0):
    shock = np.random.standard_t(df=df) * np.sqrt((df - 2) / df)
    return float(np.clip(shock, lower, upper))

def safe_price_update(current_price, turn_return):
    multiplier = float(np.clip(1.0 + turn_return, 0.05, 1.12))
    updated_price = current_price * multiplier
    return float(np.clip(updated_price, MIN_PRICE, MAX_PRICE))

def update_stock_price(stock: models.Stock):
    regime = STOCK_REGIME
    effect = stock_regime_effect[regime]

    shock = bounded_t_shock(df=6, lower=-2.5, upper=2.5)

    valuation_pull = -0.015 * np.log(max(stock.price, MIN_PRICE) / stock.anchor_price)
    turn_return = (
        stock.growth
        + effect['growth_shift'] * stock.market_sensitivity
        + stock.risk * effect['risk_multiplier'] * shock
        + valuation_pull
    )
    turn_return = float(np.clip(turn_return, MIN_STOCK_TURN_RETURN, MAX_STOCK_TURN_RETURN))

    candidate_price = safe_price_update(stock.price, turn_return)

    if candidate_price < stock.book_value_floor:
        below_ratio = (stock.book_value_floor - candidate_price) / stock.book_value_floor
        rebound = min(MAX_REBOUND, 0.35 * below_ratio)
        candidate_price = safe_price_update(candidate_price, rebound)

        # Soft floor keeps price near fundamentals without unrealistic snap-backs
        candidate_price = max(candidate_price, 0.92 * stock.book_value_floor)

    stock.price = float(np.clip(candidate_price, MIN_PRICE, MAX_PRICE))

def update_crypto_price(crypto: models.Crypto):
    regime = CRYPTO_REGIME
    effect = crypto_regime_effect[regime]

    shock = bounded_t_shock(df=5, lower=-2.8, upper=2.8)

    # Mild mean reversion keeps very long simulations from unrealistically exploding
    valuation_pull = -0.03 * np.log(max(crypto.price, MIN_PRICE) / crypto.anchor_price)
    turn_return = (
        crypto.growth
        + effect['growth_shift'] * crypto.market_sensitivity
        + crypto.risk * effect['risk_multiplier'] * shock
        + valuation_pull
    )
    turn_return = float(np.clip(turn_return, MIN_CRYPTO_TURN_RETURN, MAX_CRYPTO_TURN_RETURN))

    crypto.price = safe_price_update(crypto.price, turn_return)