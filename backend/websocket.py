from fastapi import WebSocket, WebSocketDisconnect
import asyncio
from game_manager import game_manager
from models import User, Lobby
from utils import broadcast
from game_state import GameState

ROUND_TIMEOUT = 10  # sekundy

def render_lobby_state(lobby: Lobby):
    return {
        "type": "update_lobby",
        "id": lobby.id,
        "host_id": lobby.host_id,
        "users": [p.name for p in lobby.users.values()],
    }

async def handle_connection(ws: WebSocket, lobby_id: str, user_id: str):
    await ws.accept()

    lobby = game_manager.get_lobby(lobby_id)

    if not lobby:
        await ws.close()
        return

    user = lobby.users.get(user_id)

    if not user:
        await ws.close()
        return
    
    user.ws = ws

    await broadcast(lobby, render_lobby_state(lobby))

    while True:
        try:
            msg = await ws.receive_json()
            await handle_event(lobby, user, msg)
        except WebSocketDisconnect:
            await handle_disconnect(lobby, user)
            break
        except Exception as e:
            print(f"Error handling message: {e}")
            break
        finally:
            user.ws = None

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
    moves = {p.id: p.current_move for p in lobby.users.values()}
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

async def handle_disconnect(lobby: Lobby, user: User):
    del lobby.users[user.id]

    if lobby.host_id == user.id:
        if lobby.users:
            lobby.host_id = next(iter(lobby.users.keys()))
        else:
            lobby.host_id = None

    await broadcast(lobby, render_lobby_state(lobby))


async def handle_event(lobby: Lobby, user: User, msg: dict):
    async with lobby.lock:
        msg_type = msg.get("type")

        if msg_type == "start":
            if lobby.host_id != user.id:
                print("Non-host tried to start the game, ignoring.")
                return

            lobby.started = True
            lobby.game_state = GameState(list(lobby.users.keys()))

            await broadcast(lobby, {"type": "started"})

        elif msg_type == "move":
            user.current_move = msg.get("move", {})

            # jeśli to pierwszy ruch w rundzie → start timera
            if not getattr(lobby, "round_task", None):
                lobby.round_task = asyncio.create_task(start_round_timer(lobby))

            # jeśli wszyscy gotowi → resolve natychmiast
            if all(p.ready for p in lobby.users.values()):
                await resolve_round(lobby)

            
