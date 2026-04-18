import numpy as np
from shutil import move
from contract import Move
from models import Player, Stock, Crypto, Property
from update_market_prices import update_stock_price, update_crypto_price, next_regime

class GameState:
    def __init__(self, players_ids : list[str]):
        self.turn : int = 1 
        self.max_turns : int = 100
        self.game_ended : bool = False

        self.rng = np.random.default_rng()  # wspólne źródło losowości dla całej gry

        self.players : dict[str, Player] = {player_id: Player(player_id) for player_id in players_ids}
        self.board : list[dict[str, str]] = self.create_board()
        self.stocks : list[Stock] = self.init_stocks()
        self.cryptos : list[Crypto] = self.init_crypto()
        self.properties : list[Property] = self.init_properties()

    def _init_properties(self):
        return [
            Property(id=201, name='Garaże', price=75_000.0, rent=500.0, energy_use=120.0),
            Property(id=202, name='Kawalerki', price=160_000.0, rent=1_500.0, energy_use=1_600.0),
            Property(id=203, name='Mieszkania', price=260_000.0, rent=2_200.0, energy_use=2_900.0),
            Property(id=204, name='Domy', price=1_350_000.0, rent=6_500.0, energy_use=5_200.0),
        ]
    
    def _init_stocks(self):
        return [
            Stock(
                id=1, ticker='PKO', name='PKO Bank', industry='banking',
                price=67.40, number_of_shares=125,
                growth=0.0050, risk=0.020, market_sensitivity=1.00, book_value_floor=55
            ),
            Stock(
                id=2, ticker='TPE', name='Tauron', industry='utilities',
                price=7.20, number_of_shares=175,
                growth=0.0020, risk=0.030, market_sensitivity=0.85, book_value_floor=5
            ),
            Stock(
                id=3, ticker='PKN', name='PKN Orlen', industry='energy',
                price=72.80, number_of_shares=145,
                growth=0.0015, risk=0.035, market_sensitivity=1.20, book_value_floor=40
            ),
            Stock(
                id=4, ticker='CDR', name='CD Projekt Red', industry='gaming',
                price=152.00, number_of_shares=10,
                growth=0.0040, risk=0.055, market_sensitivity=1.25, book_value_floor=10
            ),
            Stock(
                id=5, ticker='PZU', name='PZU', industry='insurance',
                price=55.10, number_of_shares=9,
                growth=0.0010, risk=0.015, market_sensitivity=0.30, book_value_floor=20
            ),
        ]

    def _init_crypto(self):
        return [
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

    def _create_board(self):
        return [
            {"type": "go", "name": "Start"},
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
            {"type": "real_estate", "name": "Domy"},
        ]
    
    def _apply_player_move(self, player_id : str, move: Move):
        self.players[player_id].position += move.steps
        if self.players[player_id].position >= len(self.board):
            self.players[player_id].position %= len(self.board)
            self.players[player_id].money += 200  # bonus za przejście przez start
        

    def _update_market(self):
        for stock in self.stocks:
            update_stock_price(stock)

        for crypto in self.cryptos:
            update_crypto_price(crypto)

        next_regime(rng=self.rng)

    def _apply_chance_card(self, player_id):
        pass

    def _get_chance_card(self):
        pass

    def _get_event(self):
        pass

    def apply_moves(self, moves):
        results = []
        for player_id, move in moves.items():
            self._apply_player_move(player_id, move)

        self._update_market()

        self.turn += 1

        

        return results

