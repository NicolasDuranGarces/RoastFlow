from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import api_router
from .core.config import settings
from .core.initial_data import create_initial_superuser
from .db import init_db

app = FastAPI(title=settings.project_name, root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    create_initial_superuser()


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "RoastSync API"}


app.include_router(api_router, prefix=settings.api_v1_prefix)
