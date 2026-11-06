-- Données de démonstration. Identifiants fixes pour pouvoir les citer dans les tests.

INSERT INTO fighters (id, email, display_name, first_name, last_name, city, disciplines, weight_class,
                      weight_kg, declared_level, wins, losses, draws, rating, licence_number,
                      medical_certificate_until, status, bio) VALUES
  ('f0000000-0000-4000-8000-000000000001', 'karim.belkacem@castagne.local', 'Le Marteau', 'Karim', 'Belkacem', 'Pau',
   '{BOXING,KICKBOXING}', 'MIDDLEWEIGHT', 79.5, 8, 24, 5, 1, 4.7, 'FFB-64-00123', '2027-06-30', 'APPROVED',
   'Former regional boxing champion.'),
  ('f0000000-0000-4000-8000-000000000002', 'lea.etcheverry@castagne.local', 'Lame Basque', 'Léa', 'Etcheverry', 'Bayonne',
   '{MUAY_THAI}', 'FEATHERWEIGHT', 57.0, 7, 15, 3, 0, 4.8, 'FFKMDA-64-0456', '2027-03-31', 'APPROVED',
   'Muay Thai, elbow and knee specialist.'),
  ('f0000000-0000-4000-8000-000000000003', 'thomas.garcia@castagne.local', 'Big Tom', 'Thomas', 'Garcia', 'Toulouse',
   '{MMA,WRESTLING}', 'HEAVYWEIGHT', 112.0, 9, 31, 7, 2, 4.5, 'FMMAF-31-0789', '2027-01-15', 'APPROVED',
   'Wrestler turned MMA fighter.'),
  ('f0000000-0000-4000-8000-000000000004', 'ines.moreau@castagne.local', 'La Comète', 'Inès', 'Moreau', 'Bordeaux',
   '{BOXING}', 'LIGHTWEIGHT', 61.0, 6, 11, 4, 1, 4.3, 'FFB-33-0321', '2027-09-30', 'APPROVED',
   'Boxer with fast footwork.'),
  ('f0000000-0000-4000-8000-000000000005', 'julien.laborde@castagne.local', 'Le Bûcheron', 'Julien', 'Laborde', 'Pau',
   '{KICKBOXING,MMA}', 'LIGHT_HEAVYWEIGHT', 90.0, 7, 18, 9, 0, 4.1, 'FFKMDA-64-0987', '2027-04-30', 'APPROVED',
   'Heavy hitter, average stamina.'),
  ('f0000000-0000-4000-8000-000000000006', 'sofia.ramos@castagne.local', 'Sofia la Tornade', 'Sofia', 'Ramos', 'Bayonne',
   '{JUDO,MMA}', 'BANTAMWEIGHT', 54.0, 8, 20, 2, 0, 4.9, 'FFJDA-64-0654', '2027-08-31', 'APPROVED',
   'Judoka, formidable on the ground.'),
  ('f0000000-0000-4000-8000-000000000007', 'maxime.dupuy@castagne.local', 'Max', 'Maxime', 'Dupuy', 'Toulouse',
   '{BOXING}', 'WELTERWEIGHT', 69.0, 4, 3, 2, 0, NULL, 'FFB-31-0111', '2027-05-31', 'PENDING',
   'Registration awaiting approval (hidden from search).'),
  ('f0000000-0000-4000-8000-000000000008', 'yanis.cherif@castagne.local', 'Le Roc', 'Yanis', 'Chérif', 'Bordeaux',
   '{MMA}', 'WELTERWEIGHT', 77.0, 7, 14, 6, 1, 3.9, 'FMMAF-33-0222', '2026-10-31', 'SUSPENDED',
   'Suspended: medical certificate expired.');

-- Tarifs Duel et Show pour les combattants approuvés (centimes d'euro).
INSERT INTO fighter_rates (fighter_id, package, amount_cents) VALUES
  ('f0000000-0000-4000-8000-000000000001', 'DUEL', 20000), ('f0000000-0000-4000-8000-000000000001', 'SHOW', 35000),
  ('f0000000-0000-4000-8000-000000000002', 'DUEL', 18000), ('f0000000-0000-4000-8000-000000000002', 'SHOW', 30000),
  ('f0000000-0000-4000-8000-000000000003', 'DUEL', 25000), ('f0000000-0000-4000-8000-000000000003', 'SHOW', 45000),
  ('f0000000-0000-4000-8000-000000000004', 'DUEL', 15000), ('f0000000-0000-4000-8000-000000000004', 'SHOW', 28000),
  ('f0000000-0000-4000-8000-000000000005', 'DUEL', 16000), ('f0000000-0000-4000-8000-000000000005', 'SHOW', 29000),
  ('f0000000-0000-4000-8000-000000000006', 'DUEL', 22000), ('f0000000-0000-4000-8000-000000000006', 'SHOW', 40000),
  ('f0000000-0000-4000-8000-000000000007', 'DUEL', 9000);

-- Disponibilités : les soirées de vendredi et samedi des quatre prochaines semaines, 17 h – 23 h (heure de Paris).
-- Relatives à la date d'initialisation, pour rester dans le futur.
INSERT INTO availability (fighter_id, period)
SELECT f.id,
       tstzrange((d + time '17:00') AT TIME ZONE 'Europe/Paris', (d + time '23:00') AT TIME ZONE 'Europe/Paris')
FROM fighters f
CROSS JOIN generate_series(current_date + 3, current_date + 30, interval '1 day') AS g(day)
CROSS JOIN LATERAL (SELECT g.day::date AS d) AS x
WHERE f.status = 'APPROVED'
  AND extract(isodow FROM d) IN (5, 6);
