from models import Player, Stock, Crypto, Property, ChanceCard


def board():
    return [
        {"type": "go", "name": "Start"},
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
        {"type": "real_estate", "name": "Domy"},
    ]

def chance_cards() -> list[ChanceCard]:
        return [
            ChanceCard(
                 id=1, 
                 description='CD Projekt Red released a disappointing game. CDR stock plummets 20%.',
                 effect=lambda game, _: game.change_stock_prices(tickers={"CDR"}, change_pct=-0.20)
                 ),  
            ChanceCard(
                 id=2, 
                 description='NBP cuts interest rates by 50%. All interest rates drop by 50% .',
                 effect=lambda game, _: game.change_interest_rates(change_pct=-0.50)
                 ),
            ChanceCard(
                 id=3, 
                 description='Energy crisis worsens. Energy and utilities stocks drop 15%.',
                 effect=lambda game, _: game.change_stock_prices(industries={"energy", "utilities"}, change_pct=-0.15)
                 ),
            ChanceCard(
                 id=4, 
                 description='Regulatory crackdown on crypto. All crypto prices drop by 25%.',
                 effect=lambda game, _: game.change_crypto_prices(change_pct=-0.25)
                 ),
            ChanceCard(
                 id=5, 
                 description='ETF with BTC and ETH gets approved. Both cryptocurrencies surge by 18%.',
                 effect=lambda game, _: game.change_crypto_prices(tickers={"BTC", "ETH"}, change_pct=0.18)
                 ),
            ChanceCard(
                 id=6, 
                 description='Data leak at a major bank. Bank stocks drop by 10%.',
                 effect=lambda game, _: game.change_stock_prices(industries={"banking"}, change_pct=-0.10)
                 ),
            ChanceCard(
                 id=7, 
                 description='Witcher 4 announced! CDR stock jumps 25%.',
                 effect=lambda game, _: game.change_stock_prices(tickers={"CDR"}, change_pct=0.25)
                 ),
            ChanceCard(
                 id=8, 
                 description='Global increase in fuel prices! Fuel becomes twice as expensive for 5 turns, and energy companies grow by 20%.',
                 effect=lambda game, _: game.change_fuel_price_multiplier(2.0, 5) and game.change_stock_prices(industries={"energy"}, change_pct=0.20)
                 ),
            ChanceCard(
                 id=9, 
                 description='Cyberattack on a major crypto exchange. ETH and SOL drop by 17%.',
                 effect=lambda game, _: game.change_crypto_prices(tickers={"ETH", "SOL"}, change_pct=-0.17)
                 ),
            ChanceCard(
                 id=10, 
                 description='Recession fears grow. Stock market drops 15% in the next turn.',
                 effect=lambda game, _: game.change_stock_prices(change_pct=-0.15)
                 ),
            ChanceCard(
                 id=11, 
                 description='Tech boom! Tech stocks surge by 9% in the next turn.',
                 effect=lambda game, _: game.change_stock_prices(change_pct=0.09)
                 ),
            ChanceCard(
                 id=12, 
                 description='Record oil production. Energy companies surge by 12%.',
                 effect=lambda game, _: game.change_stock_prices(industries={"energy"}, change_pct=0.12)
                 ),
            ChanceCard(
                 id=13, 
                 description='Flood! Insurance rates drop by 8%.',
                 effect=lambda game, _: game.change_stock_prices(industries={"insurance"}, change_pct=-0.08)
                 ),
            ChanceCard(
                 id=14, 
                 description='Solana announces a major upgrade. SOL surges 20%, ETH follows with a 10% increase.',
                 effect=lambda game, _: game.change_crypto_prices(tickers={"SOL"}, change_pct=0.20) and game.change_crypto_prices(tickers={"ETH"}, change_pct=0.10)
                 ),
            ChanceCard(
                 id=15, 
                 description='Cold winter and high energy consumption. Energy companies grow by 14%.',
                 effect=lambda game, _: game.change_stock_prices(industries={"energy", "utilities"}, change_pct=0.14)
                 ),
            ChanceCard(
                 id=16, 
                 description='Real estate market crisis! All property prices drop by 15% in the next turn.',
                 effect=lambda game, _: game.change_property_prices(change_pct=-0.15)
                ),
        ]


def properties():
    return [
        Property(id=201, name='garaz', price=75_000.0, rent=500.0, energy_use=50.0),
        Property(id=202, name='kawalerka', price=160_000.0, rent=1_500.0, energy_use=160.0),
        Property(id=203, name='mieszkanie', price=260_000.0, rent=2_200.0, energy_use=290.0),
        Property(id=204, name='dom', price=1_350_000.0, rent=6_500.0, energy_use=520.0),
    ]

def stocks():
    return [
        Stock(
            id=1, ticker='PKO', name='PKO Bank', industry='banking',
            price=67.40, number_of_shares=125_000,
            growth=0.0050, risk=0.020, market_sensitivity=1.00, book_value_floor=55
        ),
        Stock(
            id=2, ticker='TPE', name='Tauron', industry='utilities',
            price=7.20, number_of_shares=175_000,
            growth=0.0020, risk=0.030, market_sensitivity=0.85, book_value_floor=5
        ),
        Stock(
            id=3, ticker='PKN', name='PKN Orlen', industry='energy',
            price=72.80, number_of_shares=145_000,
            growth=0.0015, risk=0.035, market_sensitivity=1.20, book_value_floor=40
        ),
        Stock(
            id=4, ticker='CDR', name='CD Projekt Red', industry='gaming',
            price=152.00, number_of_shares=10_000,
            growth=0.0040, risk=0.055, market_sensitivity=1.25, book_value_floor=10
        ),
        Stock(
            id=5, ticker='PZU', name='PZU', industry='insurance',
            price=55.10, number_of_shares=9_000,
            growth=0.0010, risk=0.015, market_sensitivity=0.30, book_value_floor=20
        ),
        Stock(
            id=6, ticker='DNP', name='Dino', industry='food',
            price=380.00, number_of_shares=12_000,
            growth=0.0060, risk=0.025, market_sensitivity=0.75, book_value_floor=250
        ),
    ]

def crypto():
    return [
        Crypto(
            id=101, ticker='BTC', name='Bitcoin',
            price=84500.0, growth=0.006, risk=0.08, market_sensitivity=0.90
        ),
        Crypto(
            id=102, ticker='ETH', name='Ethereum',
            price=4300.0, growth=0.008, risk=0.10, market_sensitivity=1.00
        ),
        Crypto(
            id=103, ticker='SOL', name='Solana',
            price=185.0, growth=0.008, risk=0.14, market_sensitivity=1.10
        ),
    ]
