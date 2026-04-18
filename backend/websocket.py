from fastapi import WebSocket
import asyncio
from game_manager import game_manager
from models import Player
from utils import broadcast
from auth import verify_token
from game_state import GameState

ROUND_TIMEOUT = 10  # sekundy

async def handle_connection(ws: WebSocket, lobby_id: str, token: str):
    await ws.accept()

    data = verify_token(token)
    player_id = data["player_id"]

    lobby = game_manager.get_lobby(lobby_id)
    if not lobby:
        await ws.close()
        return

    # pomocnicze pola runtime
    if not hasattr(lobby, "round_task"):
        lobby.round_task = None

    player = Player(player_id, f"P-{player_id[:4]}", ws)
    lobby.players[player_id] = player

    await broadcast(lobby, {"type": "update_lobby", "players": [p.name for p in lobby.players.values()]})

    try:
        while True:
            msg = await ws.receive_json()
            await handle_event(lobby, player, msg)
    except:
        del lobby.players[player_id]

async def start_round_timer(lobby):
    # uruchamiany przy pierwszym ruchu w rundzie
    await asyncio.sleep(ROUND_TIMEOUT)

    async with lobby.lock:
        # jeśli ktoś nie gotowy → auto-move (skip)
        for p in lobby.players.values():
            if not p.ready:
                p.move = {"type": "skip"}
                p.ready = True

        await resolve_round(lobby)

async def resolve_round(lobby):
    moves = {p.id: p.move for p in lobby.players.values()}
    results = lobby.game_state.apply_moves(moves)

    # reset rundy
    for p in lobby.players.values():
        p.ready = False
        p.move = None

    # anuluj timer jeśli jeszcze działa
    if getattr(lobby, "round_task", None):
        lobby.round_task.cancel()
        lobby.round_task = None

    await broadcast(lobby, {
        "type": "turn_result",
        "results": results,
        "positions": lobby.game_state.positions,
        "money": lobby.game_state.money,
        "turn": lobby.game_state.turn
    })

async def handle_event(lobby, player, msg):
    async with lobby.lock:
        if msg["type"] == "start":
            if player.id != lobby.host_id:
                return

            lobby.started = True
            lobby.game_state = GameState(list(lobby.players.keys()))

            await broadcast(lobby, {"type": "started"})

        elif msg["type"] == "move":
            player.move = msg.get("move", {})
            player.ready = True

            # jeśli to pierwszy ruch w rundzie → start timera
            if not getattr(lobby, "round_task", None):
                lobby.round_task = asyncio.create_task(start_round_timer(lobby))

            # jeśli wszyscy gotowi → resolve natychmiast
            if all(p.ready for p in lobby.players.values()):
                await resolve_round(lobby)
