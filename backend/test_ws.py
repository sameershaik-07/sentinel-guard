import asyncio
import websockets

async def test():
    try:
        async with websockets.connect('ws://localhost:8000/ws/scan') as ws:
            print('Connected')
            await ws.send('{"target_url": "https://github.com"}')
            while True:
                msg = await ws.recv()
                print(msg)
                if '"success"' in msg or '"error"' in msg:
                    break
    except Exception as e:
        print(f"Exception: {e}")

asyncio.run(test())
