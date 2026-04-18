from fastapi import WebSocket, WebSocketDisconnect
import asyncio

from game_manager import game_manager


# -------------------------
# Helpers
# -------------------------

def safe_send(ws, data):
    try:
        return asyncio.create_task(ws.send_json(data))
    except:
        return None


def broadcast(lobby, message):
    for user in lobby.users.values():
        if user.ws:
            safe_send(user.ws, message)


def lobby_state(lobby):
    return {
        "type": "lobby_update",
        "lobby_id": lobby.id,
        "host_id": lobby.host_id,
        "users": [
            {"id": u.id, "name": u.name}
            for u in lobby.users.values()
        ]
    }


# -------------------------
# MAIN WS HANDLER
# -------------------------

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

    print(f"WS CONNECTED: {user.name} ({user_id})")

    # initial state
    broadcast(lobby, lobby_state(lobby))

    try:
        while True:
            msg = await ws.receive_json()
            await handle_event(lobby, user, msg)

    except WebSocketDisconnect:
        print("WS DISCONNECT")

    except Exception as e:
        print("WS ERROR:", e)

    finally:
        # cleanup
        if user_id in lobby.users:
            del lobby.users[user_id]

<<<<<<< HEAD
async def resolve_round(lobby):
    moves = {u.id: u.current_move for u in lobby.users.values()}
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
            await broadcast(lobby, render_lobby_state(lobby))
            lobby.host_id = next(iter(lobby.users.keys()))
=======
        if lobby.users:
            if lobby.host_id == user_id:
                lobby.host_id = next(iter(lobby.users.keys()))
>>>>>>> frontend
        else:
            game_manager.remove_lobby(lobby.id)

<<<<<<< HEAD
=======
        broadcast(lobby, lobby_state(lobby))
>>>>>>> frontend


# -------------------------
# EVENTS
# -------------------------

async def handle_event(lobby, user, msg):
    msg_type = msg.get("type")

    # START GAME
    if msg_type == "start":
        if user.id != lobby.host_id:
            return

        lobby.started = True
        broadcast(lobby, {"type": "game_started"})

    # MOVE
    elif msg_type == "move":
        user.current_move = msg.get("move")

        # simple broadcast update
        broadcast(lobby, {
            "type": "move_update",
            "user_id": user.id,
            "move": user.current_move
        })