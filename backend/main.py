async def main():
    import uvicorn
    uvicorn.run("app.main:app", host="localhost", port=8000, reload=True)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())