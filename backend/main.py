import os
from fastapi import FastAPI, WebSocket
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uuid

from game_manager import game_manager
from models import Lobby, User
from websocket import handle_connection

app = FastAPI()

# CORS (DEV)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files from frontend
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend-app", "dist")

# CREATE LOBBY
@app.post("/create")
def create():
    lobby_id = str(uuid.uuid4())[:8]

    lobby = Lobby(lobby_id)
    game_manager.add_lobby(lobby)

    return {"lobby_id": lobby_id}


# JOIN LOBBY
@app.post("/join/{lobby_id}")
def join(lobby_id: str, name: str = None):
    lobby = game_manager.get_lobby(lobby_id)

    if not lobby:
        return {"error": "Lobby not found"}

    user_id = str(uuid.uuid4())

    user = User(
        id=user_id,
        name=name or "Unnamed user"
    )

    lobby.users[user_id] = user

    if len(lobby.users) == 1:
        lobby.host_id = user_id

    return {
        "ws": f"/ws/{lobby_id}",
        "user_id": user_id
    }


# WEBSOCKET ENTRY
@app.websocket("/ws/{lobby_id}")
async def ws_endpoint(ws: WebSocket, lobby_id: str, user_id: str):
    await handle_connection(ws, lobby_id, user_id)

@app.get("/")
def read_root():
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend not built. Please run 'npm run build' in the frontend-app directory."}

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    file_path = os.path.join(frontend_dir, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "Frontend not built or file not found."}