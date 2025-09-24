BEGIN;

------------------------------------------------------------
-- 1. coffee lot: pesos a gramos y precio por kilo
------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'coffeelot' AND column_name = 'green_weight_kg'
    ) THEN
        EXECUTE 'ALTER TABLE coffeelot RENAME COLUMN green_weight_kg TO green_weight_g';
        EXECUTE 'UPDATE coffeelot SET green_weight_g = green_weight_g * 1000';
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'coffeelot' AND column_name = 'price_per_kg'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'coffeelot' AND column_name = 'price_per_g'
    ) THEN
        EXECUTE 'ALTER TABLE coffeelot DROP COLUMN price_per_g';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'coffeelot' AND column_name = 'price_per_g'
    ) THEN
        EXECUTE 'ALTER TABLE coffeelot RENAME COLUMN price_per_g TO price_per_kg';
        EXECUTE 'UPDATE coffeelot SET price_per_kg = price_per_kg * 1000';
    END IF;
END
$$;

------------------------------------------------------------
-- 2. roastbatch: entradas/salidas a gramos
------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'roastbatch' AND column_name = 'green_input_kg'
    ) THEN
        EXECUTE 'ALTER TABLE roastbatch RENAME COLUMN green_input_kg TO green_input_g';
        EXECUTE 'UPDATE roastbatch SET green_input_g = green_input_g * 1000';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'roastbatch' AND column_name = 'roasted_output_kg'
    ) THEN
        EXECUTE 'ALTER TABLE roastbatch RENAME COLUMN roasted_output_kg TO roasted_output_g';
        EXECUTE 'UPDATE roastbatch SET roasted_output_g = roasted_output_g * 1000';
    END IF;
END
$$;

------------------------------------------------------------
-- 3. sales: total en gramos y limpiar columnas antiguas
------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sale' AND column_name = 'quantity_kg'
    ) THEN
        EXECUTE 'ALTER TABLE sale RENAME COLUMN quantity_kg TO total_quantity_g';
        EXECUTE 'UPDATE sale SET total_quantity_g = total_quantity_g * 1000';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sale' AND column_name = 'quantity_g'
    ) THEN
        EXECUTE 'ALTER TABLE sale RENAME COLUMN quantity_g TO total_quantity_g';
    ELSE
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'sale' AND column_name = 'total_quantity_g'
        ) THEN
            EXECUTE 'ALTER TABLE sale ADD COLUMN total_quantity_g DOUBLE PRECISION DEFAULT 0';
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sale' AND column_name = 'total_quantity_g'
    ) THEN
        EXECUTE 'UPDATE sale SET total_quantity_g = 0 WHERE total_quantity_g IS NULL';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sale' AND column_name = 'price_per_g'
    ) THEN
        EXECUTE 'ALTER TABLE sale DROP COLUMN price_per_g';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sale' AND column_name = 'price_per_kg'
    ) THEN
        EXECUTE 'ALTER TABLE sale DROP COLUMN price_per_kg';
    END IF;
END
$$;

------------------------------------------------------------
-- 4. crear tabla saleitem (si no existe) y backfill
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saleitem (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sale(id) ON DELETE CASCADE,
    roast_batch_id INTEGER NOT NULL REFERENCES roastbatch(id),
    bag_size_g INTEGER NOT NULL,
    bags INTEGER NOT NULL DEFAULT 1,
    bag_price DOUBLE PRECISION NOT NULL,
    notes TEXT
);

INSERT INTO saleitem (sale_id, roast_batch_id, bag_size_g, bags, bag_price, notes)
SELECT
    s.id,
    s.roast_batch_id,
    GREATEST(ROUND(s.total_quantity_g)::INTEGER, 1),
    1,
    COALESCE(s.total_price, 0),
    NULL
FROM sale AS s
WHERE s.roast_batch_id IS NOT NULL
  AND s.total_quantity_g IS NOT NULL
  AND s.total_quantity_g > 0
  AND NOT EXISTS (
      SELECT 1 FROM saleitem si WHERE si.sale_id = s.id
  );

------------------------------------------------------------
-- 5. limpiar columna legacy en sale (si sigue ahí)
------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sale' AND column_name = 'roast_batch_id'
    ) THEN
        EXECUTE 'ALTER TABLE sale DROP COLUMN roast_batch_id';
    END IF;
END
$$;

COMMIT;
