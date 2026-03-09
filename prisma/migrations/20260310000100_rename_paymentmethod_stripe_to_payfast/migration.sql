DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE LOWER(t.typname) = LOWER('PaymentMethod')
      AND e.enumlabel = 'STRIPE'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE LOWER(t.typname) = LOWER('PaymentMethod')
      AND e.enumlabel = 'PAYFAST'
  ) THEN
    ALTER TYPE "PaymentMethod" RENAME VALUE 'STRIPE' TO 'PAYFAST';
  END IF;
END
$$;