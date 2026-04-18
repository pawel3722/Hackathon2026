import numpy as np
from models import Crypto, Stock

REGIME_STATES = ['bull', 'bear']
STOCK_REGIME = "bull"
CRYPTO_REGIME = "bull"

stock_regime_transition = {
    'bull': [0.84, 0.16],
    'bear': [0.28, 0.72]
}

stock_regime_effect = {
    'bull': {'growth_shift': 0.008, 'risk_multiplier': 0.90},
    'bear': {'growth_shift': -0.010, 'risk_multiplier': 1.20}
}

crypto_regime_transition = {
    'bull': [0.78, 0.22],
    'bear': [0.35, 0.65]
}

crypto_regime_effect = {
    'bull': {'growth_shift': 0.012, 'risk_multiplier': 1.00},
    'bear': {'growth_shift': -0.016, 'risk_multiplier': 1.30}
}

# Stability controls to keep game dynamics realistic and avoid numerical explosions
MAX_STOCK_TURN_RETURN = 0.40
MIN_STOCK_TURN_RETURN = -0.30
MAX_CRYPTO_TURN_RETURN = 2.00
MIN_CRYPTO_TURN_RETURN = -0.80
MAX_REBOUND = 0.18
MAX_PRICE = 1e6
MIN_PRICE = 0.01
PRICE_HISTORY_LIMIT = 20

def reset_price_history(asset):
    asset.price_history = [float(asset.price)]

def append_price_history(asset, limit=PRICE_HISTORY_LIMIT):
    if not hasattr(asset, "price_history") or asset.price_history is None:
        asset.price_history = [float(asset.price)]
        return

    asset.price_history.append(float(asset.price))
    if len(asset.price_history) > limit:
        asset.price_history.pop(0)

def update_regime(rng):
    global STOCK_REGIME, CRYPTO_REGIME
    STOCK_REGIME = rng.choice(REGIME_STATES, p=stock_regime_transition[STOCK_REGIME])
    CRYPTO_REGIME = rng.choice(REGIME_STATES, p=crypto_regime_transition[CRYPTO_REGIME])

def bounded_t_shock(rng, df, lower=-3.0, upper=3.0):
    shock = rng.standard_t(df=df) * np.sqrt((df - 2) / df)
    return float(np.clip(shock, lower, upper))

def safe_price_update(current_price, turn_return):
    multiplier = 1.0 + turn_return
    updated_price = current_price * multiplier
    return float(np.clip(updated_price, MIN_PRICE, MAX_PRICE))

def update_stock_price(stock: Stock, rng):
    regime = STOCK_REGIME
    effect = stock_regime_effect[regime]

    shock = bounded_t_shock(rng=rng, df=6, lower=-2.5, upper=2.5)

    turn_return = (
        stock.growth
        + effect['growth_shift'] * stock.market_sensitivity
        + stock.risk * effect['risk_multiplier'] * shock
    )
    turn_return = float(np.clip(turn_return, MIN_STOCK_TURN_RETURN, MAX_STOCK_TURN_RETURN))

    candidate_price = safe_price_update(stock.price, turn_return)

    if candidate_price < stock.book_value_floor:
        below_ratio = (stock.book_value_floor - candidate_price) / stock.book_value_floor
        rebound = min(MAX_REBOUND, 0.7 * below_ratio)
        candidate_price = safe_price_update(candidate_price, rebound)
        candidate_price = max(candidate_price, 0.7 * stock.book_value_floor)

    stock.price = float(np.clip(candidate_price, MIN_PRICE, MAX_PRICE))
    append_price_history(stock)

def update_crypto_price(crypto: Crypto, rng):
    regime = CRYPTO_REGIME
    effect = crypto_regime_effect[regime]

    shock = bounded_t_shock(rng=rng, df=5, lower=-2.8, upper=2.8)

    turn_return = (
        crypto.growth
        + effect['growth_shift'] * crypto.market_sensitivity
        + crypto.risk * effect['risk_multiplier'] * shock
    )
    turn_return = float(np.clip(turn_return, MIN_CRYPTO_TURN_RETURN, MAX_CRYPTO_TURN_RETURN))

    crypto.price = safe_price_update(crypto.price, turn_return)
    append_price_history(crypto)

def update_market(stocks: list[Stock], cryptos: list[Crypto], rng):
    for stock in stocks:
        update_stock_price(stock, rng)

    for crypto in cryptos:
        update_crypto_price(crypto, rng)

    update_regime(rng=rng)

def init_stock_history(stocks: list[Stock], cryptos: list[Crypto], rng, history_len: int = PRICE_HISTORY_LIMIT):
    if history_len <= 0:
        return

    for stock in stocks:
        reset_price_history(stock)

    for crypto in cryptos:
        reset_price_history(crypto)

    for _ in range(history_len - 1):
        update_market(stocks=stocks, cryptos=cryptos, rng=rng)