import numpy as np
from models import Player, Stock, Crypto
from update_market_prices import update_stock_price, update_crypto_price, next_regime, STOCK_REGIME

class GameState:
    def __init__(self, num_of_players : int):
        self.turn : int = 1 
        self.max_turns : int = 100
        self.game_ended : bool = False
        
        self.players : list[Player] = [Player() for i in range(num_of_players)]
        
        self.board = self.create_board()

        self.current_modifiers = []

        self.rng = np.random.default_rng(seed=444)

        self.stocks = [
            Stock(
                id=1, ticker='PKO', name='PKO Bank', type='banking',
                price=67.40, number_of_shares=125,
                growth=0.0050, risk=0.020, market_sensitivity=1.00, book_value_floor=55
            ),
            Stock(
                id=2, ticker='TPE', name='Tauron', type='utilities',
                price=7.20, number_of_shares=175,
                growth=0.0020, risk=0.030, market_sensitivity=0.85, book_value_floor=5
            ),
            Stock(
                id=3, ticker='PKN', name='PKN Orlen', type='energy',
                price=72.80, number_of_shares=145,
                growth=0.0015, risk=0.035, market_sensitivity=1.20, book_value_floor=40
            ),
            Stock(
                id=4, ticker='CDR', name='CD Projekt Red', type='gaming',
                price=152.00, number_of_shares=10,
                growth=0.0040, risk=0.055, market_sensitivity=1.25, book_value_floor=10
            ),
            Stock(
                id=5, ticker='PZU', name='PZU', type='insurance',
                price=55.10, number_of_shares=9,
                growth=0.0010, risk=0.015, market_sensitivity=0.30, book_value_floor=20
            ),
        ]

        self.cryptos = [
            Crypto(
                id=101, ticker='BTC', name='Bitcoin',
                price=84500.0, growth=0.006, risk=0.08, market_sensitivity=0.90
            ),
            Crypto(
                id=102, ticker='ETH', name='Ethereum',
                price=4300.0, growth=0.008, risk=0.10, market_sensitivity=1.00
            ),
            Crypto(
                id=103, ticker='SOL', name='Solana',
                price=185.0, growth=0.008, risk=0.14, market_sensitivity=1.10
            ),
        ]

    def create_board(self):
        return [
            {"type": "go"},
            {"type": "stock_market", "name": "WSE"},
            {"type": "bank", "name": "Bank Pekao SA"},
            {"type": "crypto_exchange", "name": "OKX"},
            {"type": "real_estate", "name": "Garaże"},
            {"type": "chance", "name": "chance"},
            {"type": "stock_market", "name": "Euronext"},
            {"type": "bookmaker", "name": "STS"},
            {"type": "crypto_exchange", "name": "Bybit"},
            {"type": "real_estate", "name": "Kawalerki"},
            {"type": "park", "name": "Park Chrobrego"},
            {"type": "stock_market", "name": "NASDAQ"},
            {"type": "bank", "name": "PKO Bank Polski"},
            {"type": "crypto_exchange", "name": "Coinbase"},
            {"type": "real_estate", "name": "Mieszkania"},
            {"type": "chance", "name": "chance"},
            {"type": "stock_market", "name": "NYSE"},
            {"type": "tax", "name": "Optymalizuj podatek"},
            {"type": "crypto_exchange", "name": "Binance"},
            {"type": "real_estate", "name": "Domki"},
        ]
    
    def _apply_player_move(self, player_id, steps):
        pass

    def _update_market(self):
        for stock in self.stocks:
            update_stock_price(stock)

        for crypto in self.cryptos:
            update_crypto_price(crypto)

        next_regime(rng = self.rng)

    def _apply_chance_card(self, player_id):
        pass

    def _get_chance_card(self):
        pass

    def _get_event(self):
        pass

    def apply_moves(self, moves):
        results = []

        for player_id, move in moves.items():
            self._apply_player_move(player_id, move.get("steps"))

        # get random chance card for the next round
        self.current_modifiers.append(self._get_event())

        self._update_market()

        self.turn += 1
        
        return results

    def _print_state(self):
        print(f"Turn: {self.turn}")

        for stock in self.stocks:
            print(f"Stock {stock.ticker}: Price {stock.price:.2f}, Growth {stock.growth:.4f}, Risk {stock.risk:.4f}")
        
        for crypto in self.cryptos:
            print(f"Crypto {crypto.ticker}: Price {crypto.price:.2f}, Growth {crypto.growth:.4f}, Risk {crypto.risk:.4f}")


def _self_test_apply_moves():
    """Run a small smoke test for apply_moves when file is executed directly."""
    game_state = GameState(num_of_players=3)
    moves = {
        0: {"steps": 2, "actions": []},
        1: {"steps": 3, "actions": []},
        2: {"steps": 1, "actions": []},
    }

    game_state.apply_moves(moves)

    game_state._print_state()


if __name__ == "__main__":
    _self_test_apply_moves()

