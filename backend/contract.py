from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models import ChanceCardPlayer, Crypto, Player, Stock

class Action:
    def __init__(self, action_type : str, assets_type : str, assets_id : int, amount : float):
        self.action_type : str = action_type # "buy", "sell", "bank", "stakeholder", "card"
        self.assets_type : str = assets_type # "stock", "crypto", "property", "credit", "deposit", "issurance"
        self.assets_id : int = assets_id
        self.amount : float = amount

class Move:
    def __init__(self, steps : int, actions : list[Action]):
        if(steps > 3  or steps < 0):
            raise ValueError("Steps cannot be greater than 3 and less than 0.")
        
        self.steps : int = steps
        self.actions : list[Action] = actions

class TurnResult:
    def __init__(self, turn : int, game_ended : bool, players : list[Player], stocks : list[Stock], cryptos : list[Crypto], cards : list[ChanceCardPlayer]):
        self.turn : int = turn
        self.game_ended : bool = game_ended
        self.players : list[Player] = players
        self.stocks : list[Stock] = stocks
        self.cryptos : list[Crypto] = cryptos
        self.cards : list[ChanceCardPlayer] = cards