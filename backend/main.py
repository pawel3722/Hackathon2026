from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
# from fastapi.middleware.cors import CORSMiddleware
import uuid

from game_manager import game_manager
from models import Lobby
# from auth import create_token
from websocket import handle_connection

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


    return {
        "lobby_id": lobby_id
    }



@app.post("/join/{lobby_id}")
def join(lobby_id: str, name: str = None):
    if lobby_id not in game_manager.lobbies:
        return {"error": "Lobby not found"}
    
    lobby = game_manager.get_lobby(lobby_id)

    user_id = str(uuid.uuid4())
    user_name = name or "Unnamed user"

    user = models.User(user_id, user_name)
    lobby.users[user_id] = user

    return {
        "ws": f"/ws/{lobby_id}",
        "user_id": user_id
    }


@app.websocket("/ws/{lobby_id}")
async def ws(ws: WebSocket, lobby_id: str, user_id: str):
    await handle_connection(ws, lobby_id, user_id)
