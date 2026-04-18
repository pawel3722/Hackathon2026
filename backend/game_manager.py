import models

class GameManager:
    def __init__(self):
        self.lobbies = {}

    def add_lobby(self, lobby: models.Lobby):
        self.lobbies[lobby.id] = lobby

    def get_lobby(self, lobby_id: str) -> models.Lobby:
        return self.lobbies.get(lobby_id)

    def remove_lobby(self, lobby_id: str):
        if lobby_id in self.lobbies:
            del self.lobbies[lobby_id]


game_manager = GameManager()