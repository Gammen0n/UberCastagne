-- Fighter Catalogue : profils, tarifs, disponibilités, demandes de combat, avis.

CREATE TYPE fighter_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE package_type AS ENUM ('DUEL', 'SHOW', 'CHAMPION', 'MERCENARY');
CREATE TYPE weight_class AS ENUM (
  'FLYWEIGHT', 'BANTAMWEIGHT', 'FEATHERWEIGHT', 'LIGHTWEIGHT', 'WELTERWEIGHT',
  'MIDDLEWEIGHT', 'LIGHT_HEAVYWEIGHT', 'HEAVYWEIGHT'
);
CREATE TYPE availability_status AS ENUM ('AVAILABLE', 'RESERVED');
CREATE TYPE booking_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');
CREATE TYPE outbox_status AS ENUM ('PENDING', 'SENT', 'DEAD');

CREATE TABLE fighters (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identifiant Zitadel (claim "sub"), renseigné quand le compte est créé dans Zitadel.
  user_id                text UNIQUE,
  email                  text NOT NULL UNIQUE,
  display_name           text NOT NULL,
  first_name             text NOT NULL,
  last_name              text NOT NULL,
  city                   text NOT NULL,
  disciplines            text[] NOT NULL CHECK (cardinality(disciplines) > 0),
  weight_class           weight_class NOT NULL,
  weight_kg              numeric(5,1) NOT NULL CHECK (weight_kg > 0),
  declared_level         smallint NOT NULL CHECK (declared_level BETWEEN 1 AND 10),
  wins                   integer NOT NULL DEFAULT 0 CHECK (wins >= 0),
  losses                 integer NOT NULL DEFAULT 0 CHECK (losses >= 0),
  draws                  integer NOT NULL DEFAULT 0 CHECK (draws >= 0),
  -- Average of the fighter's reviews (NULL without review) and their count, kept up to date by
  -- the reviews_refresh_fighter trigger below. Never written by hand.
  rating                 numeric(2,1) CHECK (rating BETWEEN 1 AND 5),
  review_count           integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  reliability            numeric(3,2) NOT NULL DEFAULT 1.00 CHECK (reliability BETWEEN 0 AND 1),
  licence_number         text NOT NULL,
  medical_certificate_until date NOT NULL,
  status                 fighter_status NOT NULL DEFAULT 'PENDING',
  bio                    text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- BR-2 : la recherche ne voit que les combattants approuvés.
CREATE INDEX fighters_search_idx ON fighters (weight_class, city) WHERE status = 'APPROVED';
CREATE INDEX fighters_disciplines_idx ON fighters USING gin (disciplines);
-- Sorts offered by GET /api/fighters (same expressions as the API, id as tie-breaker for the cursor).
CREATE INDEX fighters_rating_sort_idx ON fighters ((coalesce(rating, 0)) DESC, id) WHERE status = 'APPROVED';
CREATE INDEX fighters_name_sort_idx ON fighters ((lower(display_name)), id) WHERE status = 'APPROVED';

CREATE TABLE fighter_rates (
  fighter_id   uuid NOT NULL REFERENCES fighters (id) ON DELETE CASCADE,
  package      package_type NOT NULL,
  -- US-F2 : bornes fixées par la plateforme.
  amount_cents integer NOT NULL CHECK (amount_cents BETWEEN 5000 AND 500000),
  currency     char(3) NOT NULL DEFAULT 'EUR',
  PRIMARY KEY (fighter_id, package)
);

CREATE TABLE availability (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id uuid NOT NULL REFERENCES fighters (id) ON DELETE CASCADE,
  period     tstzrange NOT NULL CHECK (NOT isempty(period)),
  status     availability_status NOT NULL DEFAULT 'AVAILABLE',
  -- Un combattant ne peut pas avoir deux créneaux qui se chevauchent.
  EXCLUDE USING gist (fighter_id WITH =, period WITH &&)
);

CREATE TABLE booking_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL,
  step            text NOT NULL CHECK (step IN ('FIGHTER', 'FIGHTER_A', 'FIGHTER_B')),
  fighter_id      uuid NOT NULL REFERENCES fighters (id),
  availability_id uuid REFERENCES availability (id),
  fight_period    tstzrange NOT NULL,
  status          booking_status NOT NULL DEFAULT 'PENDING',
  reason          text,
  callback_url    text NOT NULL,
  idempotency_key uuid NOT NULL UNIQUE,
  deadline        timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  answered_at     timestamptz,
  UNIQUE (order_id, step)
);

CREATE INDEX booking_requests_pending_idx ON booking_requests (deadline) WHERE status = 'PENDING';

CREATE TABLE reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fighter_id     uuid NOT NULL REFERENCES fighters (id) ON DELETE CASCADE,
  order_id       uuid NOT NULL,
  client_user_id text NOT NULL,
  rating         smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  -- US-C10 : un seul avis par prestation et par client.
  UNIQUE (order_id, client_user_id)
);

CREATE INDEX reviews_fighter_idx ON reviews (fighter_id, created_at DESC);

-- Recomputes fighters.rating and fighters.review_count from the reviews, so the stored rating
-- always matches the reviews and can still be indexed for sorting and filtering.
CREATE FUNCTION refresh_fighter_rating(target uuid) RETURNS void
LANGUAGE sql AS $$
  UPDATE fighters f
  SET rating = s.average, review_count = s.total, updated_at = now()
  FROM (
    SELECT round(avg(rating), 1) AS average, count(*)::int AS total FROM reviews WHERE fighter_id = target
  ) s
  WHERE f.id = target;
$$;

CREATE FUNCTION reviews_refresh_fighter() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM refresh_fighter_rating(OLD.fighter_id);
  END IF;
  -- A review moved to another fighter also changes the new fighter's rating.
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.fighter_id <> OLD.fighter_id) THEN
    PERFORM refresh_fighter_rating(NEW.fighter_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER reviews_refresh_fighter
AFTER INSERT OR UPDATE OF fighter_id, rating OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION reviews_refresh_fighter();
CREATE INDEX availability_upcoming_idx ON availability (fighter_id, (lower(period))) WHERE status = 'AVAILABLE';

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
