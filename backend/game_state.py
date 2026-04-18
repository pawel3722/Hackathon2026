import json
from unicodedata import name
import numpy as np
from contract import GameOver, TurnResult
# from collections import deque
from shutil import move
from contract import Move
from models import Credit, CryptoShare, Deposit, Mapper, Player, PlayerEndGame, Stock, Crypto, Property, ChanceCard, StockShare, User
from update_market_prices import update_crypto_price, update_stock_price, update_regime, init_stock_history, update_market
import game_init

class GameState:
    STEP_COST = 10.0
    FOOD_COST = 20.0
    ENERGY_COST = 0.15

    def __init__(self, users : list[User]):
        self.turn : int = 1 
        self.max_turns : int = 5
        self.game_ended : bool = False
        self.is_destroyed : bool = False

        self.rng = np.random.default_rng()  # wspólne źródło losowości dla całej gry

        self.players : dict[str, Player] = {id: Player(id, name) for (id, name) in users}
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
                    if current_player.money >= 1.005 * stock.price * action.amount and stock.number_of_shares >= action.amount:
                        current_player.money -= 1.005 * stock.price * action.amount
                        stock.number_of_shares -= action.amount
                        player_stock = next((ps for ps in current_player.stocks if ps.stock.id == stock.id), None)
                        if player_stock:
                            player_stock.quantity += action.amount
                        else:
                            current_player.stocks.append(StockShare(stock=Mapper.map_stock(stock), quantity=action.amount))
                elif(action.action_type == "sell"):
                    stock = next((s for s in self.stocks if s.id == action.assets_id), None)
                    player_stock = next((ps for ps in current_player.stocks if ps.stock.id == stock.id), None)
                    if player_stock and player_stock.quantity >= action.amount:
                        current_player.money += stock.price * action.amount
                        stock.number_of_shares += action.amount
                        player_stock.quantity -= action.amount
                        if player_stock.quantity == 0:
                            current_player.stocks.remove(player_stock)

        elif field["type"] == "crypto_exchange" and any(a.assets_type == "crypto" for a in move.actions):
            crypto_actions = [a for a in move.actions if a.assets_type == "crypto"]
            for action in crypto_actions:
                if(action.action_type == "buy"):
                    crypto = next((s for s in self.cryptos if s.id == action.assets_id), None)
                    if crypto and current_player.money >= 1.005 * crypto.price * action.amount:
                        current_player.money -= crypto.price * action.amount
                        player_crypto = next((pc for pc in current_player.cryptos if pc.crypto.id == crypto.id), None)
                        if player_crypto:
                            player_crypto.quantity += action.amount
                        else:
                            current_player.cryptos.append(CryptoShare(crypto=Mapper.map_crypto(crypto), quantity=action.amount))
                elif(action.action_type == "sell"):
                    crypto = next((s for s in self.cryptos if s.id == action.assets_id), None)
                    player_crypto = next((pc for pc in current_player.cryptos if pc.crypto.id == crypto.id), None)
                    if crypto and player_crypto and player_crypto.quantity >= action.amount:
                        current_player.money += crypto.price * action.amount
                        player_crypto.quantity -= action.amount
                        if player_crypto.quantity == 0:
                            current_player.cryptos.remove(player_crypto)

        elif field["type"] == "bank" and any(a.action_type == "bank" for a in move.actions):
            bank_actions = [a for a in move.actions if a.action_type == "bank"]
            for action in bank_actions:
                if action.assets_type == "credit" and action.assets_id in [1, 2, 3] and current_player.count_all_money() * 0.5 >= action.amount:
                    if action.assets_id == 1:
                        credit = Credit(amount=action.amount, instalment_rate=action.amount * 1.15 / 12 , number_of_instalments=12)
                    elif action.assets_id == 2:
                        credit = Credit(amount=action.amount, instalment_rate=action.amount * 1.125 / 24, number_of_instalments=24)
                    elif action.assets_id == 3:
                        credit = Credit(amount=action.amount, instalment_rate=action.amount * 1.1 / 36, number_of_instalments=36)
                    current_player.money += action.amount
                    current_player.credits.append(credit)
                elif action.assets_type == "deposit" and action.assets_id in [4, 5, 6]:
                    if action.assets_id == 4:
                        deposit = Deposit(amount=action.amount, lending_rate=action.amount * 1.06, number_of_instalments=12)
                    elif action.assets_id == 5:
                        deposit = Deposit(amount=action.amount, lending_rate=action.amount * 1.065, number_of_instalments=24)
                    elif action.assets_id == 6:
                        deposit = Deposit(amount=action.amount, lending_rate=action.amount * 1.07, number_of_instalments=36)
                    current_player.money -= action.amount
                    current_player.deposits.append(deposit)
                elif action.assets_type == "insurance" and action.assets_id in [7, 8, 9]:
                    if action.assets_id == 7 and current_player.money >= 20000:
                        current_player.insurance += 12
                        current_player.money -= 40000
                    elif action.assets_id == 8 and current_player.money >= 40000:
                        current_player.insurance += 24
                        current_player.money -= 60000
                    elif action.assets_id == 9 and current_player.money >= 60000:
                        current_player.insurance += 36
                        current_player.money -= 80000

        for deposit in current_player.deposits:
            deposit.number_of_instalments -= 1
        for credit in current_player.credits:
            credit.number_of_instalments -= 1

        fuel_cost = move.steps * self.STEP_COST * self.fuel_price_multiplier
        energy_cost = self.ENERGY_COST * sum(p.energy_use for p in current_player.properties)
        instalment_cost = sum(c.instalment_rate for c in current_player.credits)

        energy_total_shares = sum(s.number_of_shares for s in self.stocks if s.industry == "energy")
        food_total_shares = sum(s.number_of_shares for s in self.stocks if s.industry == "food")
        utilities_total_shares = sum(s.number_of_shares for s in self.stocks if s.industry == "utilities")

        player_energy_shares = sum(s.quantity for s in current_player.stocks if s.stock.industry == "energy")
        player_food_shares = sum(s.quantity for s in current_player.stocks if s.stock.industry == "food")
        player_utilities_shares = sum(s.quantity for s in current_player.stocks if s.stock.industry == "utilities")

        fuel_pool = all_steps * self.STEP_COST * self.fuel_price_multiplier
        food_pool = self.FOOD_COST * len(self.players)
        energy_pool = self.ENERGY_COST * sum(sum(p.energy_use for p in player.properties) for player in self.players.values())

        fuel_revenue = (fuel_pool * player_energy_shares / energy_total_shares) if energy_total_shares > 0 else 0.0
        food_revenue = (food_pool * player_food_shares / food_total_shares) if food_total_shares > 0 else 0.0
        energy_revenue = (energy_pool * player_utilities_shares / utilities_total_shares) if utilities_total_shares > 0 else 0.0
        credits_revenue = sum(c.lending_rate for c in current_player.deposits if c.number_of_instalments == 0)
        insurance_revenue = sum(p.price for p in current_player.properties) if current_player.insurance > 0 else 0

        balance_money = fuel_revenue + food_revenue + energy_revenue + credits_revenue + insurance_revenue - fuel_cost - self.FOOD_COST - energy_cost - instalment_cost
        current_player.money += balance_money

        if current_player.insurance > 0:
            current_player.insurance -= 1

        current_player.deposits = [d for d in current_player.deposits if d.number_of_instalments > 0]
        current_player.credits = [c for c in current_player.credits if c.number_of_instalments > 0]
        
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

    def _get_chance_card(self):
        if not self.chance_cards:
            return None

        card_idx = int(self.rng.integers(0, len(self.chance_cards)))
        return self.chance_cards[card_idx]
       

    def _apply_turn_status_effects(self):
        if self.pending_property_drop_pct > 0:
            self.change_property_prices(-self.pending_property_drop_pct)
            self.pending_property_drop_pct = 0.0

        if self.fuel_price_turns_left > 0:
            self.fuel_price_turns_left -= 1
            if self.fuel_price_turns_left == 0:
                self.fuel_price_multiplier = 1.0

    def apply_moves(self, moves):
        all_steps = sum(move.steps for move in moves.values())
        for player_id, move in moves.items():
            self._apply_player_move(player_id, move, all_steps)

        for player_id, move in moves.items():
            for action in move.actions:
                player = self.players[player_id]
                player_position_is_chance = self.board[player.position]["type"] == "chance"
                if action.action_type == "card" and player_position_is_chance:
                    card = next((c for c in self.chance_cards if c.id == action.assets_id), None)
                    if card:
                        card.effect(self, player_id)

        current_card  = self._get_chance_card()

        current_card.effect(self, None)
        self._apply_turn_status_effects()
        self._update_market()

        self.turn += 1

        if self.turn > self.max_turns:
            self.game_ended = True
            endgame_players = [PlayerEndGame(player) for player in self.players.values()]
            endgame_players.sort(key=lambda p: p.all_money, reverse=True)
            return GameOver(players=endgame_players, turn=self.turn)

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

    def get_initial_state(self):
        return TurnResult(
            turn=1,
            game_ended=False,
            players=list(self.players.values()),
            stocks=self.stocks,
            cryptos=self.cryptos,
            properties=self.properties,
            cards=[self._get_chance_card(), self._get_chance_card(), self._get_chance_card()],
            board=self.board
        )

from contract import Action, Move, TurnResult

if __name__ == "__main__":
    # prosta symulacja rozgrywki
    game_state = GameState(players_ids=["player1", "player2"])
    while not game_state.game_ended:
        print(f"stock prices: {[f'{s.ticker}: {s.price:.2f}' for s in game_state.stocks]}")
        
        moves = {
            "player1": Move(steps=1, actions=[
                    Action(action_type="card", assets_type="", assets_id=1, amount=0)
            ]),
            "player2": Move(steps=game_state.rng.integers(0, 3), actions=[]),
        }


        result = game_state.apply_moves(moves)
        print(f"stock prices: {[f'{s.ticker}: {s.price:.2f}' for s in game_state.stocks]}")
        print(f"Turn {result.turn} ended. Player states:")
        for player in result.players:
            print(f"  {player.id}: pos={player.position}, money={player.money:.2f}")

        if result.game_ended:
            print("Game ended.")
            break

        print(f"Stock prices: ")
        for stock in result.stocks:
            print(f"  {stock.ticker}: {stock.price:.2f} {stock.growth:.4f} {stock.risk:.4f}")

        print(f"Crypto prices: ")
        for crypto in result.cryptos:
            print(f"  {crypto.ticker}: {crypto.price:.2f} {crypto.growth:.4f} {crypto.risk:.4f}")
        
        print(f"Cards drawn: {[card.description for card in result.cards]}")
        
        print("-" * 40)

        print(game_state.stocks[0].name)
        print(game_state.stocks[0].price_history)