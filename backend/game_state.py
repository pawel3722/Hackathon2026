import random

class GameState:
    def __init__(self, players):
        self.turn = 0
        self.players = players

        self.positions = {p: 0 for p in players}
        self.money = {p: 1500 for p in players}

        self.board = self.create_board()

    def create_board(self):
        return [
            {"type": "go"},
            {"type": "stock_market", "name": "WSE"},
            {"type": "bank", "name": "Bank Pekao SA"},
            {"type": "crypto_exchange", "name": "OKX"},
            {"type": "real_estate", "name": "Garaże"},
            {"type": "chance", "name": "chance"},
            {"type": "stock_market", "name": "Euronext"},
            {"type": "bookmaker", "name": "STS"},
            {"type": "crypto_exchange", "name": "Bybit"},
            {"type": "real_estate", "name": "Kawalerki"},
            {"type": "park", "name": "Park Chrobrego"},
            {"type": "stock_market", "name": "NASDAQ"},
            {"type": "bank", "name": "PKO Bank Polski"},
            {"type": "crypto_exchange", "name": "Coinbase"},
            {"type": "real_estate", "name": "Mieszkania"},
            {"type": "chance", "name": "chance"},
            {"type": "stock_market", "name": "NYSE"},
            {"type": "tax", "name": "Optymalizuj podatek"},
            {"type": "crypto_exchange", "name": "Binance"},
            {"type": "real_estate", "name": "Domki"},
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

