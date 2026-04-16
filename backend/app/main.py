from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, apartments, bookings

app = FastAPI(title="Бронирование и всё")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(apartments.router)
app.include_router(bookings.router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
