"""Utility script to migrate unit columns from kilograms to grams.

Run this once after deploying the grams refactor to keep existing data.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from sqlalchemy import text
from sqlmodel import Session

from ..db import engine


Operation = Literal["multiply", "divide"]


@dataclass
class Conversion:
    table: str
    old_column: str
    new_column: str
    operation: Operation


CONVERSIONS: list[Conversion] = [
    Conversion("coffeelot", "green_weight_kg", "green_weight_g", "multiply"),
    Conversion("coffeelot", "price_per_kg", "price_per_g", "divide"),
    Conversion("roastbatch", "green_input_kg", "green_input_g", "multiply"),
    Conversion("roastbatch", "roasted_output_kg", "roasted_output_g", "multiply"),
    Conversion("sale", "quantity_kg", "quantity_g", "multiply"),
    Conversion("sale", "price_per_kg", "price_per_g", "divide"),
]


def column_exists(session: Session, table: str, column: str) -> bool:
    query = text(
        """
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = :table AND column_name = :column
        """
    )
    return session.exec(query, {"table": table, "column": column}).first() is not None


def convert_column(session: Session, conversion: Conversion, factor: float) -> None:
    if column_exists(session, conversion.table, conversion.new_column):
        # Already migrated; nothing to do.
        print(f"{conversion.table}.{conversion.new_column} already exists; skipping")
        return

    if not column_exists(session, conversion.table, conversion.old_column):
        print(
            f"Column {conversion.table}.{conversion.old_column} not found; skipping (perhaps already removed)"
        )
        return

    print(
        f"Renaming {conversion.table}.{conversion.old_column} -> {conversion.new_column} and converting existing values"
    )
    session.exec(
        text(
            f"ALTER TABLE {conversion.table} RENAME COLUMN {conversion.old_column} TO {conversion.new_column}"
        )
    )

    if conversion.operation == "multiply":
        session.exec(
            text(f"UPDATE {conversion.table} SET {conversion.new_column} = {conversion.new_column} * :factor"),
            {"factor": factor},
        )
    else:
        session.exec(
            text(f"UPDATE {conversion.table} SET {conversion.new_column} = {conversion.new_column} / :factor"),
            {"factor": factor},
        )


def run() -> None:
    factor = 1000.0
    with Session(engine) as session:
        for conversion in CONVERSIONS:
            convert_column(session, conversion, factor)
        session.commit()


if __name__ == "__main__":
    run()
