"""Utility script to migrate unit columns from kilograms to grams.

Run this once after deploying the grams refactor to keep existing data.
"""

from __future__ import annotations

from sqlalchemy import text
from sqlmodel import Session

from ..db import engine


def column_exists(session: Session, table: str, column: str) -> bool:
    query = text(
        """
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = :table AND column_name = :column
        """
    )
    return session.exec(query, {"table": table, "column": column}).first() is not None


def ensure_weight_column(session: Session, table: str, old: str, new: str, factor: float) -> None:
    if column_exists(session, table, new):
        return
    if not column_exists(session, table, old):
        return

    print(f"Renaming {table}.{old} -> {new} and converting to grams")
    session.exec(text(f"ALTER TABLE {table} RENAME COLUMN {old} TO {new}"))
    session.exec(
        text(f"UPDATE {table} SET {new} = {new} * :factor"),
        {"factor": factor},
    )


def ensure_price_per_kg(session: Session, factor: float) -> None:
    if column_exists(session, "coffeelot", "price_per_kg"):
        if column_exists(session, "coffeelot", "price_per_g"):
            # Clean up legacy column if both exist
            print("Dropping legacy coffeelot.price_per_g column")
            session.exec(text("ALTER TABLE coffeelot DROP COLUMN price_per_g"))
        return

    if column_exists(session, "coffeelot", "price_per_g"):
        print("Renaming coffeelot.price_per_g -> price_per_kg and converting back to kg pricing")
        session.exec(text("ALTER TABLE coffeelot RENAME COLUMN price_per_g TO price_per_kg"))
        session.exec(
            text("UPDATE coffeelot SET price_per_kg = price_per_kg * :factor"),
            {"factor": factor},
        )


def ensure_total_quantity(session: Session, factor: float) -> None:
    if not column_exists(session, "sale", "total_quantity_g"):
        if column_exists(session, "sale", "quantity_g"):
            print("Renaming sale.quantity_g -> total_quantity_g")
            session.exec(text("ALTER TABLE sale RENAME COLUMN quantity_g TO total_quantity_g"))
        elif column_exists(session, "sale", "quantity_kg"):
            print("Renaming sale.quantity_kg -> total_quantity_g and converting to grams")
            session.exec(text("ALTER TABLE sale RENAME COLUMN quantity_kg TO total_quantity_g"))
            session.exec(
                text("UPDATE sale SET total_quantity_g = total_quantity_g * :factor"),
                {"factor": factor},
            )
        else:
            print("Adding sale.total_quantity_g column")
            session.exec(text("ALTER TABLE sale ADD COLUMN total_quantity_g DOUBLE PRECISION DEFAULT 0"))

    # Remove legacy pricing columns no longer used by the application
    if column_exists(session, "sale", "price_per_g"):
        print("Dropping legacy sale.price_per_g column")
        session.exec(text("ALTER TABLE sale DROP COLUMN price_per_g"))
    if column_exists(session, "sale", "price_per_kg"):
        print("Dropping legacy sale.price_per_kg column")
        session.exec(text("ALTER TABLE sale DROP COLUMN price_per_kg"))



def ensure_sale_items_table(session: Session) -> None:
    table_exists = session.exec(
        text(
            """
            SELECT 1
            FROM information_schema.tables
            WHERE table_name = 'saleitem'
            """
        )
    ).first()

    if table_exists:
        return

    print("Creating saleitem table and backfilling from existing sales")
    session.exec(
        text(
            """
            CREATE TABLE saleitem (
                id SERIAL PRIMARY KEY,
                sale_id INTEGER NOT NULL REFERENCES sale(id) ON DELETE CASCADE,
                roast_batch_id INTEGER NOT NULL REFERENCES roastbatch(id),
                bag_size_g INTEGER NOT NULL,
                bags INTEGER NOT NULL DEFAULT 1,
                bag_price DOUBLE PRECISION NOT NULL,
                notes TEXT
            )
            """
        )
    )

    # Backfill: treat each historical sale as a single line item if it has quantity information
    rows = session.exec(
        text(
            "SELECT id, roast_batch_id, total_quantity_g, total_price FROM sale"
            " WHERE total_quantity_g IS NOT NULL AND total_quantity_g > 0"
        )
    ).all()

    for sale_id, roast_batch_id, total_quantity_g, total_price in rows:
        if roast_batch_id is None:
            continue
        bag_price = total_price if total_price is not None else 0
        session.exec(
            text(
                """
                INSERT INTO saleitem (sale_id, roast_batch_id, bag_size_g, bags, bag_price)
                VALUES (:sale_id, :roast_batch_id, :bag_size_g, 1, :bag_price)
                """
            ),
            {
                "sale_id": sale_id,
                "roast_batch_id": roast_batch_id,
                "bag_size_g": int(total_quantity_g),
                "bag_price": bag_price,
            },
        )

    if column_exists(session, "sale", "roast_batch_id"):
        print("Dropping legacy sale.roast_batch_id column")
        session.exec(text("ALTER TABLE sale DROP COLUMN roast_batch_id"))


def run() -> None:
    factor = 1000.0
    with Session(engine) as session:
        ensure_weight_column(session, "coffeelot", "green_weight_kg", "green_weight_g", factor)
        ensure_price_per_kg(session, factor)
        ensure_weight_column(session, "roastbatch", "green_input_kg", "green_input_g", factor)
        ensure_weight_column(session, "roastbatch", "roasted_output_kg", "roasted_output_g", factor)
        ensure_total_quantity(session, factor)
        ensure_sale_items_table(session)
        session.commit()


if __name__ == "__main__":
    run()
