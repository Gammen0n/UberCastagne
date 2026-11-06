-- Order : commandes, étapes de la saga, chronologie, arbitres (liste fixe dans le MVP).

CREATE TYPE package_type AS ENUM ('DUEL', 'SHOW', 'CHAMPION', 'MERCENARY');
CREATE TYPE order_status AS ENUM (
  'CREATED', 'IN_PROGRESS', 'PAYMENT_PENDING', 'CONFIRMED', 'PAID', 'COMPLETED', 'CANCELLED', 'FAILED'
);
CREATE TYPE step_status AS ENUM ('NOT_STARTED', 'PENDING', 'DONE', 'FAILED', 'EXPIRED', 'COMPENSATED');

-- Arbitres : extension Arbitration stubée, la liste est tenue par Order.
CREATE TABLE referees (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              text UNIQUE,
  email                text NOT NULL UNIQUE,
  first_name           text NOT NULL,
  last_name            text NOT NULL,
  city                 text NOT NULL,
  disciplines          text[] NOT NULL CHECK (cardinality(disciplines) > 0),
  certification_number text NOT NULL,
  fee_cents            integer NOT NULL CHECK (fee_cents >= 0),
  active               boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id       text NOT NULL,
  package              package_type NOT NULL,
  status               order_status NOT NULL DEFAULT 'CREATED',
  venue_slot_id        uuid NOT NULL,
  referee_id           uuid REFERENCES referees (id),
  fight_at             timestamptz NOT NULL,
  -- Devis complet en centimes (US-C4).
  price_fighters_cents integer NOT NULL CHECK (price_fighters_cents >= 0),
  price_venue_cents    integer NOT NULL CHECK (price_venue_cents >= 0),
  price_referee_cents  integer NOT NULL CHECK (price_referee_cents >= 0),
  price_insurance_cents integer NOT NULL CHECK (price_insurance_cents >= 0),
  price_fees_cents     integer NOT NULL CHECK (price_fees_cents >= 0),
  price_total_cents    integer GENERATED ALWAYS AS (
    price_fighters_cents + price_venue_cents + price_referee_cents + price_insurance_cents + price_fees_cents
  ) STORED,
  currency             char(3) NOT NULL DEFAULT 'EUR',
  failure_reason       text,
  -- Idempotence de POST /orders : même clé + même corps = même réponse ; corps différent = 422.
  idempotency_key      uuid NOT NULL UNIQUE,
  request_hash         text NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_client_idx ON orders (client_user_id, created_at DESC);

CREATE TABLE order_fighters (
  order_id   uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  fighter_id uuid NOT NULL,
  step       text NOT NULL CHECK (step IN ('FIGHTER', 'FIGHTER_A', 'FIGHTER_B')),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  PRIMARY KEY (order_id, step),
  UNIQUE (order_id, fighter_id)
);

CREATE TABLE saga_steps (
  order_id      uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  name          text NOT NULL,
  position      smallint NOT NULL,
  status        step_status NOT NULL DEFAULT 'NOT_STARTED',
  deadline      timestamptz,
  reason        text,
  resource_id   uuid,
  status_url    text,
  last_sequence integer NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (order_id, name)
);

-- Les réplicas d'Order prennent les étapes échues avec SELECT … FOR UPDATE SKIP LOCKED.
CREATE INDEX saga_steps_deadline_idx ON saga_steps (deadline) WHERE status = 'PENDING';

CREATE TABLE timeline_events (
  id             bigserial PRIMARY KEY,
  order_id       uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  type           text NOT NULL,
  step           text,
  detail         jsonb NOT NULL DEFAULT '{}',
  correlation_id text,
  occurred_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX timeline_events_order_idx ON timeline_events (order_id, id);

-- Déduplication des callbacks (livraison au moins une fois).
CREATE TABLE received_events (
  event_id    uuid PRIMARY KEY,
  order_id    uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  step        text NOT NULL,
  sequence    integer NOT NULL CHECK (sequence >= 1),
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE fight_results (
  order_id    uuid PRIMARY KEY REFERENCES orders (id),
  referee_id  uuid NOT NULL REFERENCES referees (id),
  winner_fighter_id uuid,
  outcome     text NOT NULL CHECK (outcome IN ('WIN', 'DRAW', 'NO_CONTEST', 'NO_SHOW')),
  decision    text NOT NULL,
  rounds      smallint CHECK (rounds >= 0),
  recorded_at timestamptz NOT NULL DEFAULT now()
);
