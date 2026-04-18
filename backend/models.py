from __future__ import annotations
import asyncio
from typing import List, TYPE_CHECKING


if TYPE_CHECKING:
    from contract import Move
    from game_state import GameState

class User:
    def __init__(self, id : str, name : str):
        self.id : str = id
        self.name : str = name
        self.current_move : Move = None
        self.ready : bool = False
        self.ws = None
        
class Player:
    def __init__(self, id: str):
        self.id : str = id
        self.money : float = 5000.00
        self.is_bankrupt : bool = False
        self.position : int = 0
        self.stocks : list[StockShare] = []
        self.cryptos : list[CryptoShare] = []
        self.credits : list[Credit] = []
        self.deposits : list[Deposit] = []
        self.properties : list[Property] = []

class Lobby:
    def __init__(self, id : str, host_id : str):
        self.id : str = id
        self.host_id : str = host_id
        self.players : list[User] = {}
        self.started : bool = False
        self.game_state : GameState = None
        self.lock = asyncio.Lock()
        self.users: dict[str, User] = {} # player_id -> User


class Stock:
    def __init__(self, id : int, ticker : str, name : str, industry : str, price : float, number_of_shares : int, growth : float, risk : float, market_sensitivity : float, book_value_floor : float):
        self.id : int = id
        self.ticker : str = ticker
        self.name : str = name
        self.industry : str = industry #taki enum, np. fuel, food, media
        self.price : float = price
        self.number_of_shares : int = number_of_shares
        self.growth : float = growth
        self.risk : float = risk
        self.market_sensitivity : float = market_sensitivity
        self.book_value_floor : float = book_value_floor

class StockDto:
    def __init__(self, id : int, ticker : str, name : str, industry : str, price : float, number_of_shares : int):
        self.id : int = id
        self.ticker : str = ticker
        self.name : str = name
        self.industry : str = industry #taki enum, np. fuel, food, media
        self.price : float = price
        self.number_of_shares : int = number_of_shares

class StockShare:
    def __init__(self, stock: StockDto, quantity: int):
        self.stock : StockDto = stock
        self.quantity : int = quantity

class Crypto:
    def __init__(self, id : int, ticker : str, name : str, price : float, growth : float, risk : float, market_sensitivity : float):
        self.id : int = id
        self.ticker : str = ticker
        self.name : str = name
        self.price : float = price
        self.growth  : float = growth
        self.risk : float = risk
        self.market_sensitivity : float = market_sensitivity

class CryptoDto:
    def __init__(self, id : int, ticker : str, name : str, price : float):
        self.id : int = id
        self.ticker : str = ticker
        self.name : str = name
        self.price : float = price

class CryptoShare:
    def __init__(self, crypto: CryptoDto, quantity: int):
        self.crypto : CryptoDto = crypto
        self.quantity : int = quantity

class Property:
    def __init__(self, id : int, name : str, price : float, rent : float, energy_use : float):
        self.id : int = id
        self.name : str = name
        self.price : float = price
        self.rent : float = rent
        self.energy_use : float = energy_use

class Credit:
    def __init__(self, id : int, price : float, number_of_instalments : int):
        self.id : int = id
        self.price : float = price
        self.number_of_instalments : int = number_of_instalments
        self.instalment_rate : float = price / number_of_instalments

class Deposit:
    def __init__(self, id : int, price : float, number_of_instalments : int, lending_rate : float):
        self.id : int = id
        self.price : float = price
        self.number_of_instalments : int = number_of_instalments
        self.lending_rate : float = lending_rate

class ChanceCard:
    def __init__(self, id : int, description : str):
        self.id : int = id
        self.description : str = description

class ChanceCardPlayer:
    def __init__(self, id : int, description : str, player_id : str):
        self.id : int = id
        self.description : str = description
        self.player_id : str = player_id