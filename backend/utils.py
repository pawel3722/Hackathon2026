async def broadcast(lobby, message):
    for p in lobby.users.values():
        if hasattr(p, 'ws') and p.ws:
            try:
                await p.ws.send_json(message)
            except Exception:
                pass
        