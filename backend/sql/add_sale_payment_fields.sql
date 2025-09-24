BEGIN;

ALTER TABLE sale
    ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS amount_paid DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS paid_at DATE;

-- Inicializar con el total existente para mantener ventas históricas como pagadas.
UPDATE sale
SET amount_paid = total_price,
    is_paid = TRUE
WHERE total_price IS NOT NULL;

COMMIT;
