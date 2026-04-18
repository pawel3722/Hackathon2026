import asyncio

class Player:
    def __init__(self, id, name, websocket=None):
        self.id = id
        self.name = name
        self.ws = websocket
        self.current_move = None
        self.ready = False
        self.money = 5000.00
        self.stocks = {}
        self.cryptos = {}
        self.credits = {}
        self.deposits = {}
        self.properties = {}

class Lobby:
    def __init__(self, id, host_id):
        self.id = id
        self.host_id = host_id
        self.players = {}
        self.started = False
        self.game_state = None
        self.lock = asyncio.Lock()

class Stock:
    def __init__(self, id, name, type, price, number_of_shares):
        self.id = id
        self.name = name
        self.type = type #taki enum, np. fuel, food, media
        self.price = price
        self.number_of_shares = number_of_shares

class Crypto:
    def __init__(self, id, name, price):
        self.id = id
        self.name = name
        self.price = price

class Property:
    def __init__(self, id, name, price):
        self.id = id
        self.name = name
        self.price = price

class Credit:
    def __init__(self, id, price, number_of_instalments):
        self.id = id
        self.price = price
        self.number_of_instalments = number_of_instalments
        self.instalment_rate = price / number_of_instalments

class Deposit:
    def __init__(self, id, price, number_of_instalments, lending_rate):
        self.id = id
        self.price = price
        self.number_of_instalments = number_of_instalments
        self.lending_rate = lending_rate