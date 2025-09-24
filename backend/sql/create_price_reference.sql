BEGIN;

CREATE TABLE IF NOT EXISTS pricereference (
    id SERIAL PRIMARY KEY,
    variety_id INTEGER REFERENCES variety(id),
    process TEXT NOT NULL,
    bag_size_g INTEGER NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    notes TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS pricereference_unique_idx
    ON pricereference (COALESCE(variety_id, -1), process, bag_size_g);

COMMIT;
