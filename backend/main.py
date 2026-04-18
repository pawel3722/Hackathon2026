from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
# from fastapi.middleware.cors import CORSMiddleware
import uuid

from game_manager import game_manager
from models import Lobby
from auth import create_token
from websocket import handle_connection

from pydantic import BaseModel
import models

app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Allows all origins
#     allow_credentials=True,
#     allow_methods=["*"],  # Allows all methods
#     allow_headers=["*"],  # Allows all headers
# )

@app.get("/")
def serve_index():
    return FileResponse("index.html")

@app.post("/create")
def create():
    lobby_id = str(uuid.uuid4())
    host_id = str(uuid.uuid4())

    lobby = Lobby(lobby_id, host_id)
    game_manager.add_lobby(lobby)

    token = create_token(host_id, lobby_id)

    return {
        "lobby_id": lobby_id,
        "token": token
    }



class JoinRequest(BaseModel):
    name: str

@app.post("/join/{lobby_id}")
def join(lobby_id: str, request: JoinRequest):
    if lobby_id not in game_manager.lobbies:
        return {"error": "Lobby not found"}
    
    lobby = game_manager.get_lobby(lobby_id)

    player_id = str(uuid.uuid4())
    token = create_token(player_id, lobby_id)

    player_name = request.name | "Unnamed player"

    player = models.Player(player_id, player_name)
    lobby.players[player_id] = player

    return {
        "token": token,
        "ws": f"/ws/{lobby_id}?token={token}"
    }


@app.websocket("/ws/{lobby_id}")
async def ws(ws: WebSocket, lobby_id: str):
    token = ws.query_params.get("token")
    await handle_connection(ws, lobby_id, token)
