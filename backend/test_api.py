import asyncio
import httpx

async def main():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Register
        email = f"test_{asyncio.get_event_loop().time()}@example.com"
        r1 = await client.post("/auth/register", json={
            "email": email,
            "password": "password123",
            "full_name": "Test User",
            "phone": "+123",
            "gender": "Мужской"
        })
        print("Register:", r1.status_code, r1.text)
        
        # Create apartment
        r2 = await client.post("/apartments/", data={
            "name": "Test Apt",
            "address": "Test Address",
            "price": "100",
            "description": "Test Desc"
        })
        print("Create Apt:", r2.status_code, r2.text)

asyncio.run(main())
