from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import persons, foods, week_plans

app = FastAPI(title="Nutrition App API", version="1.0.0")

import os

_extra_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        *_extra_origins,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(persons.router, prefix="/persons", tags=["persons"])
app.include_router(foods.router, prefix="/foods", tags=["foods"])
app.include_router(week_plans.router, prefix="/week_plans", tags=["week_plans"])


@app.get("/")
def root():
    return {"status": "ok", "message": "Nutrition App API"}
