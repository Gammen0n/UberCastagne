-- Venues : salles, créneaux, réservations temporaires (holds).

CREATE TYPE slot_status AS ENUM ('OPEN', 'CANCELLED');
CREATE TYPE hold_status AS ENUM ('HELD', 'CONFIRMED', 'RELEASED', 'EXPIRED');

CREATE TABLE venues (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Gérant de la salle : identifiant Zitadel, renseigné quand le compte existe.
  manager_user_id text,
  manager_email   text NOT NULL,
  name            text NOT NULL,
  address         text NOT NULL,
  postal_code     text NOT NULL,
  city            text NOT NULL,
  latitude        numeric(8,5),
  longitude       numeric(8,5),
  capacity        integer NOT NULL CHECK (capacity > 0),
  disciplines     text[] NOT NULL CHECK (cardinality(disciplines) > 0),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX venues_city_idx ON venues (city);
CREATE INDEX venues_manager_idx ON venues (manager_email);

CREATE TABLE slots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    uuid NOT NULL REFERENCES venues (id) ON DELETE CASCADE,
  period      tstzrange NOT NULL CHECK (NOT isempty(period)),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency    char(3) NOT NULL DEFAULT 'EUR',
  status      slot_status NOT NULL DEFAULT 'OPEN',
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- Deux créneaux actifs d'une même salle ne se chevauchent pas (409 overlap).
  EXCLUDE USING gist (venue_id WITH =, period WITH &&) WHERE (status = 'OPEN')
);

CREATE TABLE holds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id         uuid NOT NULL REFERENCES slots (id),
  order_id        uuid NOT NULL,
  idempotency_key uuid NOT NULL UNIQUE,
  status          hold_status NOT NULL DEFAULT 'HELD',
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  -- BR-4 : un hold dure au plus 72 h.
  CHECK (expires_at <= created_at + interval '72 hours')
);

-- BR-4 : un créneau ne peut jamais être réservé deux fois.
CREATE UNIQUE INDEX holds_one_active_per_slot ON holds (slot_id) WHERE status IN ('HELD', 'CONFIRMED');
CREATE INDEX holds_expiring_idx ON holds (expires_at) WHERE status = 'HELD';
