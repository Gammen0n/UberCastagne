-- Payment : paiements, clés d'idempotence, versements. Jamais de données de carte (SEC-6) : seulement des références du prestataire.

CREATE TYPE payment_status AS ENUM (
  'REQUESTED', 'AUTHORISED', 'PENDING_PROVIDER', 'REFUSED', 'CAPTURED', 'RELEASED', 'REFUNDED', 'PAID_OUT'
);
CREATE TYPE beneficiary_type AS ENUM ('FIGHTER', 'VENUE', 'REFEREE', 'PLATFORM');
CREATE TYPE payout_status AS ENUM ('PENDING', 'PAID', 'FROZEN', 'FAILED');
CREATE TYPE outbox_status AS ENUM ('PENDING', 'SENT', 'DEAD');

CREATE TABLE payments (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- BR-10 : un seul paiement par commande.
  order_id                 uuid NOT NULL UNIQUE,
  status                   payment_status NOT NULL DEFAULT 'REQUESTED',
  amount_cents             integer NOT NULL CHECK (amount_cents > 0),
  currency                 char(3) NOT NULL DEFAULT 'EUR',
  provider_payment_token   text,
  provider_authorisation_id text,
  authorisation_expires_at timestamptz,
  capture_at               timestamptz,
  refunded_cents           integer NOT NULL DEFAULT 0 CHECK (refunded_cents >= 0),
  attempts                 smallint NOT NULL DEFAULT 0,
  callback_url             text NOT NULL,
  last_error               text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CHECK (refunded_cents <= amount_cents)
);

CREATE TABLE idempotency_keys (
  key           uuid PRIMARY KEY,
  operation     text NOT NULL,
  request_hash  text NOT NULL,
  response_status smallint,
  response_body jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- Clés conservées 7 jours (section 3.1).
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '7 days'
);

CREATE TABLE payouts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id       uuid NOT NULL REFERENCES payments (id),
  beneficiary_type beneficiary_type NOT NULL,
  beneficiary_id   uuid,
  amount_cents     integer NOT NULL CHECK (amount_cents >= 0),
  status           payout_status NOT NULL DEFAULT 'PENDING',
  idempotency_key  uuid NOT NULL UNIQUE,
  provider_transfer_id text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  paid_at          timestamptz,
  UNIQUE (payment_id, beneficiary_type, beneficiary_id)
);

CREATE TABLE outbox (
  id              bigserial PRIMARY KEY,
  event_id        uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL,
  step            text NOT NULL,
  callback_url    text NOT NULL,
  payload         jsonb NOT NULL,
  status          outbox_status NOT NULL DEFAULT 'PENDING',
  attempts        smallint NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX outbox_pending_idx ON outbox (next_attempt_at) WHERE status = 'PENDING';
