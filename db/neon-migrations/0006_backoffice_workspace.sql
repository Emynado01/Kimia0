ALTER TABLE products ADD COLUMN IF NOT EXISTS tags_json jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method text;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING','AWAITING_PAYMENT','CONFIRMED','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUND_REQUESTED','REFUNDED'));
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('UNPAID','PENDING','AUTHORIZED','PAID','FAILED','PARTIALLY_REFUNDED','REFUNDED'));

CREATE TABLE IF NOT EXISTS product_promotions (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id text REFERENCES product_variants(id) ON DELETE CASCADE,
  sale_price_cents integer,
  percent_off integer,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((sale_price_cents IS NOT NULL) OR (percent_off IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS product_promotions_product_id_idx ON product_promotions(product_id);

CREATE TABLE IF NOT EXISTS order_events (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor_id text REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL,
  note text,
  metadata_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_events_order_id_idx ON order_events(order_id);

CREATE TABLE IF NOT EXISTS customer_notes (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id text REFERENCES users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_notes_user_id_idx ON customer_notes(user_id);
