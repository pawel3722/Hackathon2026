import socketio
import uvicorn

sio = socketio.AsyncServer(async_mode='asgi')
app = socketio.ASGIApp(sio, static_files={
    '/': {'content_type': 'text/html', 'filename': 'index.html'}
})

# Game state
# Now mapping session IDs to Player Numbers (1-4)
joined_players = {} 
submissions = {}
game_started = False
expected_submissions = 0

def get_available_id():
    """Finds the lowest available player ID from 1 to 4."""
    used_ids = set(joined_players.values())
    for i in range(1, 5):
        if i not in used_ids:
            return i
    return None

@sio.event
async def connect(sid, environ):
    # The browser connects immediately, but they haven't "joined" the lobby yet.
    print(f"Client connected in background: {sid}")

@sio.event
async def join_game(sid):
    global joined_players, game_started, expected_submissions
    
    # Reject if the game is already started
    if game_started:
        await sio.emit('error', {'message': 'Game already in progress!'}, to=sid)
        return

    # Reject if the lobby is full
    if len(joined_players) >= 4:
        await sio.emit('error', {'message': 'Game is currently full!'}, to=sid)
        return

    # Prevent double-joining
    if sid in joined_players:
        return 

    # Assign an ID and add them to the game
    player_id = get_available_id()
    joined_players[sid] = player_id
    print(f"Player {player_id} joined ({sid}). Total: {len(joined_players)}/4")
    
    # Tell this specific client what their ID is
    await sio.emit('assigned_id', {'player_id': player_id}, to=sid)
    
    # Add player to the game room
    await sio.enter_room(sid, 'game_room')
    
    # Broadcast the updated player count to everyone in the room
    await sio.emit('player_count', {'count': len(joined_players)}, room='game_room')
    
    # Start the game if the lobby is full
    if len(joined_players) == 4 and not game_started:
        game_started = True
        expected_submissions = 4
        print("4 players reached. Starting game!")
        await sio.emit('game_start', room='game_room')

@sio.event
async def request_start_game(sid):
    global game_started, expected_submissions
    # Only Player 1 can start early, and only if we have at least 1 player
    if joined_players.get(sid) == 1 and not game_started:
        if len(joined_players) > 0:
            game_started = True
            expected_submissions = len(joined_players)
            print(f"Player 1 started game with {expected_submissions} players!")
            await sio.emit('game_start', room='game_room')

@sio.event
async def disconnect(sid):
    global joined_players, submissions
    
    if sid in joined_players:
        player_id = joined_players.pop(sid)
        print(f"Player {player_id} disconnected.")
        # No need to leave_room, it happens automatically on disconnect
    else:
        print(f"Unjoined client disconnected: {sid}")
        
    if sid in submissions:
        del submissions[sid]
        
    # Inform remaining players of the new count
    await sio.emit('player_count', {'count': len(joined_players)}, room='game_room')

@sio.event
async def submit_number(sid, data):
    global submissions, game_started, expected_submissions
    
    if sid in joined_players:
        try:
            number = float(data['number'])
            submissions[sid] = number
            player_id = joined_players[sid]
            print(f"Received {number} from Player {player_id}. ({len(submissions)}/{expected_submissions} submitted)")
            
            if len(submissions) >= expected_submissions:
                total_sum = sum(submissions.values())
                print(f"All numbers received. Total sum: {total_sum}")
                
                await sio.emit('game_result', {'sum': total_sum}, room='game_room')
                submissions.clear()
                game_started = False # Reset for next round
                joined_players.clear() # Clear players so they can rejoin or something, or just leave it
                
        except (ValueError, KeyError):
            print(f"Invalid data received from {sid}")

if __name__ == '__main__':
    print("Server running! Open http://localhost:5000 in your browser.")
    uvicorn.run(app, host='127.0.0.1', port=5000)