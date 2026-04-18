from models import Player, Stock, Crypto, Property
import update_market_prices

class GameState:
    def __init__(self, num_of_players : int):
        self.turn : int = 1 
        self.max_turns : int = 100
        self.game_ended : bool = False
        
        self.players : list[Player] = [Player() for i in range(num_of_players)]
        
        self.board : list[dict[str, str]] = self.create_board()

        self.stocks = self.init_stocks()
        self.cryptos = self.init_crypto()
        self.properties = self.init_properties()

    def init_properties(self):
        return [
            Property(id=201, name='garaz', price=75_000.0, rent=500.0, energy_use=120.0),
            Property(id=202, name='kawalerka', price=160_000.0, rent=1_500.0, energy_use=1_600.0),
            Property(id=203, name='mieszkanie', price=260_000.0, rent=2_200.0, energy_use=2_900.0),
            Property(id=204, name='dom', price=1_350_000.0, rent=6_500.0, energy_use=5_200.0),
        ]
    
    def init_stocks(self):
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

    def init_crypto(self):
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

    def create_board(self):
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
            {"type": "real_estate", "name": "Domki"},
        ]
    
    def _apply_player_move(self, player_id, steps):
        pass

    def _update_market(self):
        pass

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



        # 1. ruch wszystkich
        for player_id, move in moves.items():
            steps = move.get("steps") or self.roll_dice()
            self.positions[player_id] += steps

            if self.positions[player_id] >= len(self.board):
                self.positions[player_id] %= len(self.board)
                self.money[player_id] += 200

            pos = self.positions[player_id]
            field = self.board[pos]

            if field["type"] == "property":
                owner = self.properties.get(pos)

                if not owner:
                    if self.money[player_id] >= field["price"]:
                        self.money[player_id] -= field["price"]
                        self.properties[pos] = player_id
                        results.append(f"{player_id} bought {field['name']}")

                elif owner != player_id:
                    rent = field["rent"]
                    self.money[player_id] -= rent
                    self.money[owner] += rent
                    results.append(f"{player_id} paid {rent} to {owner}")

            elif field["type"] == "tax":
                self.money[player_id] -= field["amount"]
                results.append(f"{player_id} paid tax {field['amount']}")



        self.turn += 1

        

        return results

