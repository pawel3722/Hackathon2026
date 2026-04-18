import json
import numpy as np
from contract import TurnResult
from collections import deque
from shutil import move
from contract import Move
from models import CryptoShare, Mapper, Player, Stock, Crypto, Property, ChanceCard, StockShare
from update_market_prices import update_crypto_price, update_stock_price, update_regime
import game_init

class GameState:
    STEP_COST = 10.0
    FOOD_COST = 20.0
    ENERGY_COST = 0.15

    def __init__(self, players_ids : list[str]):
        self.turn : int = 1 
        self.max_turns : int = 100
        self.game_ended : bool = False
        self.is_destroyed : bool = False

        self.rng = np.random.default_rng()  # wspólne źródło losowości dla całej gry

        self.players : dict[str, Player] = {player_id: Player(player_id) for player_id in players_ids}
        self.board : list[dict[str, str]] = game_init.boards()
        self.stocks : list[Stock] = game_init.stocks()
        self.cryptos : list[Crypto] = game_init.crypto()
        self.properties : list[Property] = game_init.properties()
        self.chance_cards : list[ChanceCard] = game_init.chance_cards()

        # Timed / deferred effects triggered by chance cards.
        self.fuel_price_multiplier: float = 1.0
        self.fuel_price_turns_left: int = 0
        self.pending_property_drop_pct: float = 0.0
        self.max_excluded_chance_cards: int = 10
        self.excluded_chance_card_queue: deque[int] = deque()

    def _apply_player_move(self, player_id : str, move: Move, all_steps: int):
        current_player = self.players[player_id]

        current_player.position += move.steps
        if current_player.position >= len(self.board):
            current_player.position %= len(self.board)
            current_player.money += 200  # bonus za przejście przez start
        pos = current_player.position
        field = self.board[pos]

        if field["type"] == "stock_market" and any(a.assets_type == "stock" for a in move.actions):
            stock_actions = [a for a in move.actions if a.assets_type == "stock"]
            for action in stock_actions:
                if(action.action_type == "buy"):
                    stock = next((s for s in self.stocks if s.id == action.assets_id), None)
                    if current_player.money >= stock.price * action.amount and stock.number_of_shares >= action.amount:
                        current_player.money -= stock.price * action.amount
                        stock.number_of_shares -= action.amount
                        player_stock = next((ps for ps in current_player.stocks if ps.stock.id == stock.id), None)
                        if player_stock:
                            player_stock.quantity += action.amount
                        else:
                            current_player.stocks.append(StockShare(stock=Mapper.stock_to_dto(stock), quantity=action.amount))
                elif(action.action_type == "sell"):
                    stock = next((s for s in self.stocks if s.id == action.assets_id), None)
                    player_stock = next((ps for ps in current_player.stocks if ps.stock.id == stock.id), None)
                    if player_stock and player_stock.quantity >= action.amount:
                        current_player.money += stock.price * action.amount
                        stock.number_of_shares += action.amount
                        player_stock.quantity -= action.amount
                        if player_stock.quantity == 0:
                            current_player.stocks.remove(player_stock)

        elif field["type"] == "crypto_exchange":
            if(action.action_type == "buy"):
                crypto = next((s for s in self.cryptos if s.id == action.assets_id), None)
                if current_player.money >= crypto.price * action.amount:
                    current_player.money -= crypto.price * action.amount
                    player_crypto = next((pc for pc in current_player.cryptos if pc.crypto.id == crypto.id), None)
                    if player_crypto:
                        player_crypto.quantity += action.amount
                    else:
                        current_player.cryptos.append(CryptoShare(crypto=Mapper.crypto_to_dto(crypto), quantity=action.amount))
            elif(action.action_type == "sell"):
                crypto = next((s for s in self.cryptos if s.id == action.assets_id), None)
                player_crypto = next((pc for pc in current_player.cryptos if pc.crypto.id == crypto.id), None)
                if player_crypto and player_crypto.quantity >= action.amount:
                    current_player.money += crypto.price * action.amount
                    player_crypto.quantity -= action.amount
                    if player_crypto.quantity == 0:
                        current_player.cryptos.remove(player_crypto)

        for deposit in current_player.deposits:
            deposit.number_of_instalments -= 1
        for credit in current_player.credits:
            credit.number_of_instalments -= 1

        fuel_cost = move.steps * self.STEP_COST
        energy_cost = self.ENERGY_COST * current_player.properties.sum(p.energy_use for p in current_player.properties)
        instalment_cost = current_player.credits.sum(c.instalment_rate for c in current_player.credits)

        fuel_revenue = all_steps * self.STEP_COST * sum(s.quantity for s in current_player.stocks if s.stock.industry == "energy") / (s.number_of_shares for s in self.stocks if s.industry == "energy").sum()
        food_revenue = self.FOOD_COST * len(self.players) * sum(s.quantity for s in current_player.stocks if s.stock.industry == "food") / (s.number_of_shares for s in self.stocks if s.industry == "food").sum()
        energy_revenue = self.ENERGY_COST * sum(sum(p.energy_use for p in player.properties) for player in self.players.values()) * sum(s.quantity for s in current_player.stocks if s.stock.industry == "utilities") / (s.number_of_shares for s in self.stocks if s.industry == "utilities").sum()
        credits_revenue = sum(c.lending_rate for c in current_player.deposits if c.number_of_instalments == 0)
        insurance_revenue = sum(p.price for p in current_player.properties) if current_player.insurance > 0 else 0

        balance_money = fuel_revenue + food_revenue + energy_revenue + credits_revenue + insurance_revenue - fuel_cost - self.FOOD_COST - energy_cost - instalment_cost
        current_player.money += balance_money

        if current_player.insurance > 0:
            current_player.insurance -= 1

        current_player.deposits.remove_all(lambda d: d.number_of_instalments == 0)
        current_player.credits.remove_all(lambda c: c.number_of_instalments == 0)
        
    def _update_market(self):
        for stock in self.stocks:
            update_stock_price(stock)

        for crypto in self.cryptos:
            update_crypto_price(crypto)

        update_regime(rng = self.rng)

    def _change_stock_prices(self, change_pct: float, tickers: set[str] | None = None, industries: set[str] | None = None):
        for stock in self.stocks:
            if tickers and stock.ticker in tickers:
                stock.price = stock.price * (1.0 + change_pct)
                continue

            if industries and stock.industry in industries:
                stock.price = stock.price * (1.0 + change_pct)
                continue

            if tickers is None and industries is None:
                stock.price = stock.price * (1.0 + change_pct)

    def _change_crypto_prices(self, change_pct: float, tickers: set[str] | None = None):
        for crypto in self.cryptos:
            if tickers is None or crypto.ticker in tickers:
                crypto.price = crypto.price * (1.0 + change_pct)

    def _change_property_prices(self, change_pct: float):
        for prop in self.properties:
            prop.price = prop.price * (1.0 + change_pct)

    def _exclude_chance_card(self, card_id: int):
        if card_id in self.excluded_chance_card_queue:
            return

        if len(self.excluded_chance_card_queue) >= self.max_excluded_chance_cards:
            self.excluded_chance_card_queue.popleft()

        self.excluded_chance_card_queue.append(card_id)

    def _apply_chance_card(self, player_id: str):
        card = self._get_chance_card()
        if card is None:
            return None

        self._exclude_chance_card(card.id)

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

    def _get_chance_card(self):
        if not self.chance_cards:
            return None

        available_cards = [
            card for card in self.chance_cards
            if card.id not in self.excluded_chance_card_queue
        ]
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
        all_steps = sum(move.steps for move in moves.values())
        for player_id, move in moves.items():
            self._apply_player_move(player_id, move, all_steps)

        self._update_market()
        self._apply_turn_status_effects()
        self._get_event()

        self.turn += 1        

        return results
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
            cards=[],
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
