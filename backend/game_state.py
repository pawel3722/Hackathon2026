import json
import numpy as np
from contract import GameOver, TurnResult
# from collections import deque
from shutil import move
from contract import Move
from models import Credit, CryptoShare, Deposit, Mapper, Player, PlayerEndGame, Stock, Crypto, Property, ChanceCard, StockShare
from update_market_prices import update_crypto_price, update_stock_price, update_regime, init_stock_history, update_market
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
        self.board : list[dict[str, str]] = game_init.board()
        self.stocks : list[Stock] = game_init.stocks()
        self.cryptos : list[Crypto] = game_init.crypto()
        self.properties : list[Property] = game_init.properties()
        self.chance_cards : list[ChanceCard] = game_init.chance_cards()
        init_stock_history(self.stocks, self.cryptos, self.rng)

        # Timed / deferred effects triggered by chance cards.
        self.fuel_price_multiplier: float = 1.0
        self.fuel_price_turns_left: int = 0
        self.pending_property_drop_pct: float = 0.0
        self.max_excluded_chance_cards: int = 10

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

        elif field["type"] == "bank" and action.action_type == "bank":
            if action.actions_type == "credit" and action.assets_id in [1, 2, 3]:
                if action.assets_id == 1:
                    credit = Credit(amount=action.amount, instalment_rate=action.amount * 1.15 / 12 , number_of_instalments=12)
                elif action.assets_id == 2:
                    credit = Credit(amount=action.amount, instalment_rate=action.amount * 1.125 / 24, number_of_instalments=24)
                elif action.assets_id == 3:
                    credit = Credit(amount=action.amount, instalment_rate=action.amount * 1.1 / 36, number_of_instalments=36)
                current_player.money += action.amount
                current_player.credits.append(credit)
            elif(action.action_type == "deposit" and action.assets_id in [4, 5, 6]):
                if action.assets_id == 4:
                    deposit = Deposit(amount=action.amount, lending_rate=action.amount * 1.06, number_of_instalments=12)
                elif action.assets_id == 5:
                    deposit = Deposit(amount=action.amount, lending_rate=action.amount * 1.065, number_of_instalments=24)
                elif action.assets_id == 6:
                    deposit = Deposit(amount=action.amount, lending_rate=action.amount * 1.07, number_of_instalments=36)
                current_player.money -= action.amount
                current_player.deposits.append(deposit)

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
        update_market(self.stocks, self.cryptos, self.rng)

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
        all_steps = sum(move.steps for move in moves.values())
        for player_id, move in moves.items():
            self._apply_player_move(player_id, move, all_steps)

        current_card  = self._get_chance_card()

        current_card.effect(self, None)
        self._apply_turn_status_effects()
        self._update_market()

        self.turn += 1

        if self.turn > self.max_turns:
            self.game_ended = True
            return GameOver(players=[PlayerEndGame(player) for player in self.players.values()].sort(key=lambda p: p.all_money, reverse=True))

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
