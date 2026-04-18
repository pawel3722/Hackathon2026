async def broadcast(lobby, message):
    for p in lobby.players.values():
        if p.ws:
            await p.ws.send_json(message)