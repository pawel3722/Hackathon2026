from models import Lobby

async def broadcast(lobby: Lobby, message: dict):
    for p in lobby.users.values():
        if hasattr(p, 'ws') and p.ws:
            try:
                await p.ws.send_json(message)
            except Exception:
                pass
        