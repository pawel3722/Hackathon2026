from models import Player

class GameState:
    def __init__(self, num_of_players : int):
        self.game_ended : bool = False
        self.turn : int = 1 
        self.players : list[Player] = [Player() for i in range(num_of_players)]
        self.board = self.create_board()
        self.max_turns : int = 100

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

    def apply_moves(self, moves):
        results = []

        # 1. ruch wszystkich
        for player_id, move in moves.items():
            steps = move.get("steps") or self.roll_dice()
            self.positions[player_id] += steps

            if self.positions[player_id] >= len(self.board):
                self.positions[player_id] %= len(self.board)
                self.money[player_id] += 200

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

