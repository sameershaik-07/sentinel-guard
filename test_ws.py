import asyncio
import websockets
import json

async def hello():
    async with websockets.connect("ws://localhost:8000/ws/scan") as websocket:
        await websocket.send(json.dumps({"target_url": "https://example.com"}))
        try:
            while True:
                response = await websocket.recv()
                print(f"< {response}")
        except websockets.exceptions.ConnectionClosed:
            print("Connection closed")

asyncio.run(hello())
