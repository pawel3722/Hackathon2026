import json
import numpy as np
from contract import TurnResult
# from collections import deque
from shutil import move
from contract import Move
from models import Player, Stock, Crypto, Property, ChanceCard
from update_market_prices import update_crypto_price, update_stock_price, update_regime
import game_init

class GameState:
    def __init__(self, players_ids : list[str]):
        self.turn : int = 1 
        self.max_turns : int = 100
        self.game_ended : bool = False

        self.rng = np.random.default_rng()  # wspólne źródło losowości dla całej gry

        self.players : dict[str, Player] = {player_id: Player(player_id) for player_id in players_ids}
        self.board : list[dict[str, str]] = game_init.board()
        self.stocks : list[Stock] = game_init.stocks()
        self.cryptos : list[Crypto] = game_init.crypto()
        self.properties : list[Property] = game_init.properties()
        self.chance_cards : list[ChanceCard] = game_init.chance_cards()

        # Timed / deferred effects triggered by chance cards.
        self.fuel_price_multiplier: float = 1.0
        self.fuel_price_turns_left: int = 0
        self.pending_property_drop_pct: float = 0.0
        self.max_excluded_chance_cards: int = 10

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

    def change_stock_prices(self, change_pct: float, tickers: set[str] | None = None, industries: set[str] | None = None):
        for stock in self.stocks:
            if tickers and stock.ticker in tickers:
                stock.price = stock.price * (1.0 + change_pct)
                continue

            if industries and stock.industry in industries:
                stock.price = stock.price * (1.0 + change_pct)
                continue

            if tickers is None and industries is None:
                stock.price = stock.price * (1.0 + change_pct)

    def change_crypto_prices(self, change_pct: float, tickers: set[str] | None = None):
        for crypto in self.cryptos:
            if tickers is None or crypto.ticker in tickers:
                crypto.price = crypto.price * (1.0 + change_pct)

    def change_property_prices(self, change_pct: float):
        for prop in self.properties:
            prop.price = prop.price * (1.0 + change_pct)

    def change_interest_rates(self, change_pct: float):
        for player in self.players.values():
            for credit in player.credits:
                credit.instalment_rate = credit.instalment_rate * (1.0 + change_pct)
            for deposit in player.deposits:
                deposit.lending_rate = deposit.lending_rate * (1.0 + change_pct)

    def change_fuel_price_multiplier(self, multiplier: float, turns: int):
        self.fuel_price_multiplier = multiplier
        self.fuel_price_turns_left = max(self.fuel_price_turns_left, turns)

    def _apply_chance_card(self):
        pass

    def _get_chance_card(self):
        if not self.chance_cards:
            return None

        card_idx = int(self.rng.integers(0, len(self.chance_cards)))
        return self.chance_cards[card_idx]
       

    def _apply_turn_status_effects(self):
        if self.pending_property_drop_pct > 0:
            self._change_property_prices(-self.pending_property_drop_pct)
            self.pending_property_drop_pct = 0.0

        if self.fuel_price_turns_left > 0:
            self.fuel_price_turns_left -= 1
            if self.fuel_price_turns_left == 0:
                self.fuel_price_multiplier = 1.0

    def apply_moves(self, moves):
        for player_id, move in moves.items():
            self._apply_player_move(player_id, move)

        current_card  = self._get_chance_card()

        current_card.effect(self, None)
        self._apply_turn_status_effects()
        self._update_market()

        self.turn += 1

        if self.turn > self.max_turns:
            self.game_ended = True

        return TurnResult(
            turn=self.turn,
            game_ended=self.game_ended,
            players=list(self.players.values()),
            stocks=self.stocks,
            cryptos=self.cryptos,
            properties=self.properties,
            cards=[self._get_chance_card(), self._get_chance_card(), self._get_chance_card()],
            board=self.board
        )

if __name__ == "__main__":
    # prosta symulacja rozgrywki
    game_state = GameState(players_ids=["player1", "player2"])
    while not game_state.game_ended:
        moves = {
            "player1": Move(steps=game_state.rng.integers(0, 3), actions=[]),
            "player2": Move(steps=game_state.rng.integers(0, 3), actions=[]),
        }

        result = game_state.apply_moves(moves)
        print(f"Turn {result.turn} ended. Player states:")
        for player in result.players:
            print(f"  {player.id}: pos={player.position}, money={player.money:.2f}")

        print(f"Stock prices: ")
        for stock in result.stocks:
            print(f"  {stock.ticker}: {stock.price:.2f} {stock.growth:.4f} {stock.risk:.4f}")

        print(f"Crypto prices: ")
        for crypto in result.cryptos:
            print(f"  {crypto.ticker}: {crypto.price:.2f} {crypto.growth:.4f} {crypto.risk:.4f}")
        
        print(f"Cards drawn: {[card.description for card in result.cards]}")
        
        print("-" * 40)
