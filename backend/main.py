from fastapi import FastAPI, WebSocket
import uuid

from game_manager import game_manager
from models import Lobby
from auth import create_token
from websocket import handle_connection

app = FastAPI()

@app.post("/create")
def create():
    lobby_id = str(uuid.uuid4())
    host_id = str(uuid.uuid4())

    lobby = Lobby(lobby_id, host_id)
    game_manager.create_lobby(lobby)

    token = create_token(host_id, lobby_id)

    return {
        "lobby_id": lobby_id,
        "token": token,
        "ws": f"ws://localhost:8000/ws/{lobby_id}?token={token}"
    }

@app.post("/join/{lobby_id}")
def join(lobby_id: str):
    if lobby_id not in game_manager.lobbies:
        return {"error": "Lobby not found"}

    player_id = str(uuid.uuid4())
    token = create_token(player_id, lobby_id)

    return {
        "token": token,
        "ws": f"ws://localhost:8000/ws/{lobby_id}?token={token}"
    }

@app.websocket("/ws/{lobby_id}")
async def ws(ws: WebSocket, lobby_id: str):
    token = ws.query_params.get("token")
    await handle_connection(ws, lobby_id, token)
