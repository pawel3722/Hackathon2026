import numpy as np
from models import Player, Stock, Crypto, Property, ChanceCard
from update_market_prices import update_stock_price, update_crypto_price, next_regime, STOCK_REGIME

class GameState:
    def __init__(self, playe_ids : list[int]):
        self.turn : int = 1 
        self.max_turns : int = 100
        self.game_ended : bool = False
        
        self.players : dict[int, Player] = {pid: Player(pid) for pid in playe_ids}

        self.board : list[dict[str, str]] = self.create_board()

        self.rng = np.random.default_rng(seed=444)
        
        self.current_modifiers = []
        self.stocks : list[Stock] = self.init_stocks()
        self.cryptos : list[Crypto] = self.init_crypto()
        self.properties : list[Property] = self.init_properties()
        self.chance_cards : list[ChanceCard] = self._init_chance_cards()

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
        for stock in self.stocks:
            update_stock_price(stock)

        for crypto in self.cryptos:
            update_crypto_price(crypto)

        next_regime(rng = self.rng)

    def _apply_chance_card(self, player_id):
        pass

    def _get_chance_card(self):
        if not self.chance_cards:
            return None

        card_idx = int(self.rng.integers(0, len(self.chance_cards)))
        return self.chance_cards[card_idx]

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

    
    def _init_properties(self):
        return [
            Property(id=201, name='garaz', price=75_000.0, rent=500.0, energy_use=50.0),
            Property(id=202, name='kawalerka', price=160_000.0, rent=1_500.0, energy_use=160.0),
            Property(id=203, name='mieszkanie', price=260_000.0, rent=2_200.0, energy_use=290.0),
            Property(id=204, name='dom', price=1_350_000.0, rent=6_500.0, energy_use=520.0),
        ]
    
    def _init_stocks(self):
        return [
            Stock(
                id=1, ticker='PKO', name='PKO Bank', industry='banking',
                price=67.40, number_of_shares=125_000,
                growth=0.0050, risk=0.020, market_sensitivity=1.00, book_value_floor=55
            ),
            Stock(
                id=2, ticker='TPE', name='Tauron', industry='utilities',
                price=7.20, number_of_shares=175_000,
                growth=0.0020, risk=0.030, market_sensitivity=0.85, book_value_floor=5
            ),
            Stock(
                id=3, ticker='PKN', name='PKN Orlen', industry='energy',
                price=72.80, number_of_shares=145_000,
                growth=0.0015, risk=0.035, market_sensitivity=1.20, book_value_floor=40
            ),
            Stock(
                id=4, ticker='CDR', name='CD Projekt Red', industry='gaming',
                price=152.00, number_of_shares=10_000,
                growth=0.0040, risk=0.055, market_sensitivity=1.25, book_value_floor=10
            ),
            Stock(
                id=5, ticker='PZU', name='PZU', industry='insurance',
                price=55.10, number_of_shares=9_000,
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

    def _init_chance_cards(self):
        return [
            ChanceCard(id=1, description='CD Projekt Red wypuścił Cyberpunk 2077, ale premiera okazała się niewypałem. Cena akcji CDR spada o 20%.'),
            ChanceCard(id=2, description='NBP obniża stopy procentowe. Oprocentowanie kredytów i lokat maleje o połowę.'),
            ChanceCard(id=3, description='Awaria dużej sieci energetycznej w Europie. Akcje spółek energetycznych tracą 15%.'),
            ChanceCard(id=4, description='Globalna panika na rynku krypto. Wszystkie kryptowaluty spadają o 25%.'),
            ChanceCard(id=5, description='ETF na Bitcoin i ETH zatwierdzony. BTC i ETH rosną o 18%.'),
            ChanceCard(id=6, description='Wyciek danych w dużym banku. Akcje banków spadają o 10%.'),
            ChanceCard(id=7, description='Wiedźmin 4 okazuje się nowym hitem. CD Projekt Red zyskuje +25%.'),
            ChanceCard(id=8, description='Globalny wzrost cen ropy! Paliwo drożeje dwukrotnie na 5 tur, a spółki paliwowe rosną o 20%.'),
            ChanceCard(id=9, description='Cyberatak na dużą giełdę krypto. ETH i SOL spadają o 17%.'),
            ChanceCard(id=10, description='Korekta na rynku akcji. Wszystkie akcje spadają o 15%.'),
            ChanceCard(id=11, description='Zyski firm lepsze od oczekiwań. Szeroki rynek akcji rośnie o 9%.'),
            ChanceCard(id=12, description='Rekordowe wydobycie ropy. Spółki paliwowe notują dodatkowe +12%.'),
            ChanceCard(id=13, description='Powódź! Kursy ubezpieczycieli spadają o 8%.'),
            ChanceCard(id=14, description='Altseason na rynku krypto. SOL +20%, ETH +10%.'),
            ChanceCard(id=15, description='Silna zima i wysokie zużycie energii. Spółki energetyczne +14%.'),
            ChanceCard(id=16, description='Kryzys na rynku nieruchomości! Ceny wszystkich nieruchomości spadają o 15% w kolejnej turze.'),
        ]



def _self_test_apply_moves():
    """Run a small smoke test for apply_moves when file is executed directly."""
    game_state = GameState(playe_ids=[0, 1, 2])
    moves = {
        0: {"steps": 2, "actions": []},
        1: {"steps": 3, "actions": []},
        2: {"steps": 1, "actions": []},
    }

    game_state.apply_moves(moves)

    game_state._print_state()


if __name__ == "__main__":
    _self_test_apply_moves()

