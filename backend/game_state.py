import random

class GameState:
    def __init__(self, players):
        self.turn = 0
        self.players = players

        self.positions = {p: 0 for p in players}
        self.money = {p: 1500 for p in players}
        self.properties = {}

        self.board = self.create_board()

    def create_board(self):
        return [
            {"type": "go"},
            {"type": "property", "name": "A", "price": 60, "rent": 10},
            {"type": "property", "name": "B", "price": 100, "rent": 20},
            {"type": "tax", "amount": 100},
            {"type": "property", "name": "C", "price": 120, "rent": 30},
        ]

    def roll_dice(self):
        return random.randint(1, 6) + random.randint(1, 6)

    def apply_moves(self, moves):
        results = []

        # 1. ruch wszystkich
        for player_id, move in moves.items():
            steps = move.get("steps") or self.roll_dice()
            self.positions[player_id] += steps

            if self.positions[player_id] >= len(self.board):
                self.positions[player_id] %= len(self.board)
                self.money[player_id] += 200

        # 2. rozliczenie pól (po wszystkich ruchach)
        for player_id in moves:
            pos = self.positions[player_id]
            field = self.board[pos]

            if field["type"] == "property":
                owner = self.properties.get(pos)

                if not owner:
                    if self.money[player_id] >= field["price"]:
                        self.money[player_id] -= field["price"]
                        self.properties[pos] = player_id
                        results.append(f"{player_id} bought {field['name']}")

                elif owner != player_id:
                    rent = field["rent"]
                    self.money[player_id] -= rent
                    self.money[owner] += rent
                    results.append(f"{player_id} paid {rent} to {owner}")

            elif field["type"] == "tax":
                self.money[player_id] -= field["amount"]
                results.append(f"{player_id} paid tax {field['amount']}")

        self.turn += 1

        return results

