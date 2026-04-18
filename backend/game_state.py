import numpy as np
from shutil import move
from contract import Move
from models import Player, Stock, Crypto, Property, ChanceCard
from update_market_prices import update_crypto_price, update_stock_price, update_regime

class GameState:
    def __init__(self, players_ids : list[str]):
        self.turn : int = 1 
        self.max_turns : int = 100
        self.game_ended : bool = False

        self.rng = np.random.default_rng()  # wspólne źródło losowości dla całej gry

        self.players : dict[str, Player] = {player_id: Player(player_id) for player_id in players_ids}
        self.board : list[dict[str, str]] = self._create_board()
        self.stocks : list[Stock] = self._init_stocks()
        self.cryptos : list[Crypto] = self._init_crypto()
        self.properties : list[Property] = self._init_properties()
        self.chance_cards : list[ChanceCard] = self._init_chance_cards()

        # Timed / deferred effects triggered by chance cards.
        self.fuel_price_multiplier: float = 1.0
        self.fuel_price_turns_left: int = 0
        self.pending_property_drop_pct: float = 0.0

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

        update_regime(rng = self.rng)

    def _apply_pct_change(self, value: float, pct: float) -> float:
        return round(value * (1.0 + pct), 2)

    def _change_stock_prices(self, pct: float, tickers: set[str] | None = None, industries: set[str] | None = None):
        for stock in self.stocks:
            if tickers and stock.ticker in tickers:
                stock.price = self._apply_pct_change(stock.price, pct)
                continue

            if industries and stock.industry in industries:
                stock.price = self._apply_pct_change(stock.price, pct)
                continue

            if tickers is None and industries is None:
                stock.price = self._apply_pct_change(stock.price, pct)

    def _change_crypto_prices(self, pct: float, tickers: set[str] | None = None):
        for crypto in self.cryptos:
            if tickers is None or crypto.ticker in tickers:
                crypto.price = self._apply_pct_change(crypto.price, pct)

    def _change_property_prices(self, pct: float):
        for prop in self.properties:
            prop.price = self._apply_pct_change(prop.price, pct)

    def _apply_chance_card(self, player_id: str, drawn_card_ids: set[int]):
        card = self._get_chance_card(drawn_card_ids)
        if card is None:
            return None

        drawn_card_ids.add(card.id)

        if card.id == 1:
            self._change_stock_prices(-0.20, tickers={"CDR"})
        elif card.id == 2:
            for player in self.players.values():
                for credit in player.credits:
                    credit.instalment_rate = self._apply_pct_change(credit.instalment_rate, -0.50)
                for deposit in player.deposits:
                    deposit.lending_rate = self._apply_pct_change(deposit.lending_rate, -0.50)
        elif card.id == 3:
            self._change_stock_prices(-0.15, industries={"energy", "utilities"})
        elif card.id == 4:
            self._change_crypto_prices(-0.25)
        elif card.id == 5:
            self._change_crypto_prices(0.18, tickers={"BTC", "ETH"})
        elif card.id == 6:
            self._change_stock_prices(-0.10, industries={"banking"})
        elif card.id == 7:
            self._change_stock_prices(0.25, tickers={"CDR"})
        elif card.id == 8:
            self.fuel_price_multiplier = 2.0
            self.fuel_price_turns_left = max(self.fuel_price_turns_left, 5)
            self._change_stock_prices(0.20, industries={"energy"})
        elif card.id == 9:
            self._change_crypto_prices(-0.17, tickers={"ETH", "SOL"})
        elif card.id == 10:
            self._change_stock_prices(-0.15)
        elif card.id == 11:
            self._change_stock_prices(0.09)
        elif card.id == 12:
            self._change_stock_prices(0.12, industries={"energy"})
        elif card.id == 13:
            self._change_stock_prices(-0.08, industries={"insurance"})
        elif card.id == 14:
            self._change_crypto_prices(0.20, tickers={"SOL"})
            self._change_crypto_prices(0.10, tickers={"ETH"})
        elif card.id == 15:
            self._change_stock_prices(0.14, industries={"energy", "utilities"})
        elif card.id == 16:
            self.pending_property_drop_pct = max(self.pending_property_drop_pct, 0.15)

        return card

    def _get_chance_card(self, excluded_card_ids: set[int] | None = None):
        if not self.chance_cards:
            return None

        excluded_card_ids = excluded_card_ids or set()
        available_cards = [card for card in self.chance_cards if card.id not in excluded_card_ids]
        if not available_cards:
            return None

        card_idx = int(self.rng.integers(0, len(available_cards)))
        return available_cards[card_idx]

    def _apply_turn_status_effects(self):
        if self.pending_property_drop_pct > 0:
            self._change_property_prices(-self.pending_property_drop_pct)
            self.pending_property_drop_pct = 0.0

        if self.fuel_price_turns_left > 0:
            self.fuel_price_turns_left -= 1
            if self.fuel_price_turns_left == 0:
                self.fuel_price_multiplier = 1.0

    def _get_event(self):
        pass

    def apply_moves(self, moves):
        results = []
        for player_id, move in moves.items():
            self._apply_player_move(player_id, move)

        self._update_market()

        self.turn += 1

        

        return results

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
