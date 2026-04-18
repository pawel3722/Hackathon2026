import asyncio

class Player:
    def __init__(self, id, name, websocket=None):
        self.id = id
        self.name = name
        self.ws = websocket
        self.move = None
        self.ready = False

class Lobby:
    def __init__(self, id, host_id):
        self.id = id
        self.host_id = host_id
        self.players = {}
        self.started = False
        self.game_state = None
        self.lock = asyncio.Lock()
