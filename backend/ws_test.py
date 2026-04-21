import asyncio
import websockets
import json

async def hello():
    try:
        async with websockets.connect("ws://localhost:8000/ws/scan") as ws:
            print("Connected")
            await ws.send(json.dumps({"target_url": "https://google.com"}))
            print("Sent")
            while True:
                msg = await ws.recv()
                print(msg)
    except Exception as e:
        print(f"Failed: {e}")

asyncio.run(hello())
