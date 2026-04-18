from game_state import GameState
from contract import Move, Action
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
import asyncio

from game_manager import game_manager


# -------------------------
# Helpers
# -------------------------

def safe_send(ws, data):
    try:
        return asyncio.create_task(ws.send_json(jsonable_encoder(data)))
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
            for u in lobby.users.values() if u.ws is not None
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
        # cleanup (mark as offline instead of deleting)
        if user_id in lobby.users:
            user = lobby.users[user_id]
            if user.ws == ws:
                user.ws = None

        # Calculate if all users are offline
        active_users = [u for u in lobby.users.values() if u.ws is not None]
        
        if not active_users:
            game_manager.remove_lobby(lobby.id)
        else:
            if lobby.host_id == user_id and user.ws is None:
                # pass host to the next active user instead of first in key
                lobby.host_id = active_users[0].id

            broadcast(lobby, lobby_state(lobby))


# -------------------------
# EVENTS
# -------------------------

async def handle_event(lobby, user, msg):
    msg_type = msg.get("type")

    # START GAME
    if msg_type == "start":
        if user.id != lobby.host_id:
            return
        lobby.game_state = GameState(lobby.users)
        lobby.started = True
        broadcast(lobby, {"type": "game_started", "game_state": lobby.game_state.get_initial_state()})

    # MOVE
    elif msg_type == "move":
        move_data = msg.get("move")
        actions = [Action(**a) for a in move_data.get("actions", [])]
        user.current_move = Move(steps=move_data["steps"], actions=actions)
        if all(hasattr(user, "current_move") and user.current_move is not None for user in lobby.users.values()):
            result = lobby.game_state.apply_moves({u.id: u.current_move for u in lobby.users.values()})
            for u in lobby.users.values():
                del u.current_move
            broadcast(lobby, {"type": "game_update", "result": result})

