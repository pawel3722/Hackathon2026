from backend.models import Crypto, Player, Property, Stock


class Action:
    def __init__(self, action_type : str, assets_type : str, assets_id : int, amount : float):
        self.action_type = action_type # "buy", "sell", "bank", "stakeholder", "card"
        self.assets_type = assets_type # "stock", "crypto", "property", "credit", "deposit", "ubezpieczenie"
        self.assets_id = assets_id
        self.amount = amount

class Move:
    def __init__(self, steps : int, actions : list[Action]):
        if(steps > 3  or steps < 0):
            raise ValueError("Steps cannot be greater than 3 and less than 0.")
        
        self.steps = steps
        self.actions = actions

class TurnResult:
    def __init__(self, turn : int, game_ended : bool, players : list[Player], stocks : list[Stock], cryptos : list[Crypto]):
        self.turn = turn
        self.game_ended = game_ended
        self.players = players
        self.stocks = stocks
        self.cryptos = cryptos