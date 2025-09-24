import logging
import time

from sqlalchemy.exc import OperationalError
from sqlmodel import SQLModel, create_engine

from .core.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(settings.database_url, echo=False, pool_pre_ping=True)


def init_db() -> None:
    """Initialize database with simple retry to handle cold starts."""
    retries = 10
    delay_seconds = 2

    for attempt in range(1, retries + 1):
        try:
            SQLModel.metadata.create_all(bind=engine)
            return
        except OperationalError as exc:
            if attempt == retries:
                logger.error("Database initialization failed after %s attempts", attempt)
                raise exc

            logger.warning(
                "Database not ready (attempt %s/%s). Retrying in %s seconds...",
                attempt,
                retries,
                delay_seconds,
            )
            time.sleep(delay_seconds)
