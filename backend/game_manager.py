class GameManager:
    def __init__(self):
        self.lobbies = {}

    def create_lobby(self, lobby):
        self.lobbies[lobby.id] = lobby

    def get_lobby(self, lobby_id):
        return self.lobbies.get(lobby_id)

    def remove_lobby(self, lobby_id):
        if lobby_id in self.lobbies:
            del self.lobbies[lobby_id]


game_manager = GameManager()