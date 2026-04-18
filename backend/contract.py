from __future__ import annotations
from typing import TYPE_CHECKING
from models import PlayerEndGame, Property

if TYPE_CHECKING:
    from models import ChanceCardPlayer, Crypto, Player, Stock, Property

class Action:
    def __init__(
            self, 
            action_type : str, 
            assets_type : str, 
            assets_id : int, 
            amount : float
        ):
        self.action_type : str = action_type # "buy", "sell", "bank", "stakeholder", "card"
        self.assets_type : str = assets_type # "stock", "crypto", "property", "credit", "deposit", "issurance"
        self.assets_id : int = assets_id # dla banku, jeśli = 1 to kredyt na 12 tur, jeśli = 2 to kredyt na 24 tur, jeśli = 3 to kredyt na 36 tur,
                                         # jeśli = 4 to depozyt na 12 tur, jeśli = 5 to depozyt na 24 tur, jeśli = 6 to depozyt na 36 tur
                                         # jeśli = 7 to ubezpieczenie na 12 tur, jeśli = 8 to ubezpieczenie na 24 tur, jeśli = 9 to ubezpieczenie na 36 tur
        self.amount : float = amount # dla akcji - musi tu być ilość akcji, dla krypto może być ułamek krypto do kupienia, dla buka jest kwota obstawiona, dla banku jest kwota

class Move:
    def __init__(
            self, 
            steps : int, 
            actions : list[Action]
        ):
        if(steps > 3  or steps < 0):
            raise ValueError("Steps cannot be greater than 3 and less than 0.")
        
        self.steps : int = steps
        self.actions : list[Action] = actions

class TurnResult:
    def __init__(
            self, 
            turn : int, 
            game_ended : bool, 
            players : list[Player], 
            stocks : list[Stock], 
            cryptos : list[Crypto], 
            properties : list[Property], 
            cards : list[ChanceCardPlayer], 
            board : list[dict[str, str]]
        ):
        self.turn : int = turn
        self.game_ended : bool = game_ended
        self.players : list[Player] = players
        self.stocks : list[Stock] = stocks
        self.cryptos : list[Crypto] = cryptos
        self.properties : list[Property] = properties
        self.cards : list[ChanceCardPlayer] = cards
        self.board : list[dict[str, str]] = board

class GameOver:
    def __init__(self, players : list[PlayerEndGame]):
        self.game_ended : bool = True
        self.players : list[PlayerEndGame] = players
        