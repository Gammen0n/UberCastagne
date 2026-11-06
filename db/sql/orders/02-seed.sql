-- Arbitres de démonstration. Identifiants fixes pour pouvoir les citer dans les tests.

INSERT INTO referees (id, email, first_name, last_name, city, disciplines, certification_number, fee_cents, active) VALUES
  ('e0000000-0000-4000-8000-000000000001', 'arbitre.pau@castagne.local', 'Michel', 'Lassalle', 'Pau',
   '{BOXING,KICKBOXING,MUAY_THAI}', 'ARB-64-0001', 6000, true),
  ('e0000000-0000-4000-8000-000000000002', 'arbitre.bayonne@castagne.local', 'Amaia', 'Iriarte', 'Bayonne',
   '{MUAY_THAI,MMA,JUDO}', 'ARB-64-0002', 6000, true),
  ('e0000000-0000-4000-8000-000000000003', 'arbitre.toulouse@castagne.local', 'Pierre', 'Fabre', 'Toulouse',
   '{MMA,WRESTLING}', 'ARB-31-0003', 8000, true),
  ('e0000000-0000-4000-8000-000000000004', 'arbitre.bordeaux@castagne.local', 'Nadia', 'Benali', 'Bordeaux',
   '{BOXING,KICKBOXING}', 'ARB-33-0004', 5000, true),
  ('e0000000-0000-4000-8000-000000000005', 'arbitre.inactif@castagne.local', 'Paul', 'Martin', 'Pau',
   '{BOXING}', 'ARB-64-0005', 5000, false);
