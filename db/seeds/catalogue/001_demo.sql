-- Données de démonstration. Identifiants fixes pour pouvoir les citer dans les tests.

INSERT INTO fighters (id, email, display_name, first_name, last_name, city, disciplines, weight_class,
                      weight_kg, declared_level, wins, losses, draws, licence_number,
                      medical_certificate_until, status, bio) VALUES
  ('f0000000-0000-4000-8000-000000000001', 'karim.belkacem@castagne.local', 'Le Marteau', 'Karim', 'Belkacem', 'Pau',
   '{BOXING,KICKBOXING}', 'MIDDLEWEIGHT', 79.5, 8, 24, 5, 1, 'FFB-64-00123', '2027-06-30', 'APPROVED',
   'Former regional boxing champion.'),
  ('f0000000-0000-4000-8000-000000000002', 'lea.etcheverry@castagne.local', 'Lame Basque', 'Léa', 'Etcheverry', 'Bayonne',
   '{MUAY_THAI}', 'FEATHERWEIGHT', 57.0, 7, 15, 3, 0, 'FFKMDA-64-0456', '2027-03-31', 'APPROVED',
   'Muay Thai, elbow and knee specialist.'),
  ('f0000000-0000-4000-8000-000000000003', 'thomas.garcia@castagne.local', 'Big Tom', 'Thomas', 'Garcia', 'Toulouse',
   '{MMA,WRESTLING}', 'HEAVYWEIGHT', 112.0, 9, 31, 7, 2, 'FMMAF-31-0789', '2027-01-15', 'APPROVED',
   'Wrestler turned MMA fighter.'),
  ('f0000000-0000-4000-8000-000000000004', 'ines.moreau@castagne.local', 'La Comète', 'Inès', 'Moreau', 'Bordeaux',
   '{BOXING}', 'LIGHTWEIGHT', 61.0, 6, 11, 4, 1, 'FFB-33-0321', '2027-09-30', 'APPROVED',
   'Boxer with fast footwork.'),
  ('f0000000-0000-4000-8000-000000000005', 'julien.laborde@castagne.local', 'Le Bûcheron', 'Julien', 'Laborde', 'Pau',
   '{KICKBOXING,MMA}', 'LIGHT_HEAVYWEIGHT', 90.0, 7, 18, 9, 0, 'FFKMDA-64-0987', '2027-04-30', 'APPROVED',
   'Heavy hitter, average stamina.'),
  ('f0000000-0000-4000-8000-000000000006', 'sofia.ramos@castagne.local', 'Sofia la Tornade', 'Sofia', 'Ramos', 'Bayonne',
   '{JUDO,MMA}', 'BANTAMWEIGHT', 54.0, 8, 20, 2, 0, 'FFJDA-64-0654', '2027-08-31', 'APPROVED',
   'Judoka, formidable on the ground.'),
  ('f0000000-0000-4000-8000-000000000007', 'maxime.dupuy@castagne.local', 'Max', 'Maxime', 'Dupuy', 'Toulouse',
   '{BOXING}', 'WELTERWEIGHT', 69.0, 4, 3, 2, 0, 'FFB-31-0111', '2027-05-31', 'PENDING',
   'Registration awaiting approval (hidden from search).'),
  ('f0000000-0000-4000-8000-000000000008', 'yanis.cherif@castagne.local', 'Le Roc', 'Yanis', 'Chérif', 'Bordeaux',
   '{MMA}', 'WELTERWEIGHT', 77.0, 7, 14, 6, 1, 'FMMAF-33-0222', '2026-10-31', 'SUSPENDED',
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

-- Reviews left after completed services (US-C10). Order and client ids are placeholders until Order exists.
-- Inserting them fills fighters.rating and fighters.review_count through the trigger.
INSERT INTO reviews (fighter_id, order_id, client_user_id, rating, comment, created_at)
SELECT r.fighter_id::uuid, gen_random_uuid(), r.client, r.rating, r.comment, now() - r.age
FROM (VALUES
  ('f0000000-0000-4000-8000-000000000001', 'demo-client-01', 5, 'Great sparring session, very technical and always in control.', interval '12 days'),
  ('f0000000-0000-4000-8000-000000000001', 'demo-client-02', 4, 'Hits hard but explains everything. Would book again.', interval '30 days'),
  ('f0000000-0000-4000-8000-000000000002', 'demo-client-03', 5, 'The Show was the highlight of our evening.', interval '8 days'),
  ('f0000000-0000-4000-8000-000000000002', 'demo-client-04', 5, 'Fast, precise and friendly with the guests.', interval '41 days'),
  ('f0000000-0000-4000-8000-000000000003', 'demo-client-05', 4, 'Impressive on the ground. A bit late to arrive.', interval '20 days'),
  ('f0000000-0000-4000-8000-000000000004', 'demo-client-06', 4, 'Good level, adapted the pace to mine.', interval '5 days'),
  ('f0000000-0000-4000-8000-000000000005', 'demo-client-07', 4, 'Powerful puncher, fair and respectful.', interval '17 days'),
  ('f0000000-0000-4000-8000-000000000006', 'demo-client-08', 5, 'Outstanding grappling, the referee had nothing to do.', interval '3 days'),
  ('f0000000-0000-4000-8000-000000000006', 'demo-client-09', 5, 'Our bachelor party will remember this one.', interval '26 days'),
  ('f0000000-0000-4000-8000-000000000001', 'demo-client-10', 5, 'Patient with beginners, explains every move.', interval '45 days'),
  ('f0000000-0000-4000-8000-000000000002', 'demo-client-11', 5, 'Our guests are still talking about it.', interval '52 days'),
  ('f0000000-0000-4000-8000-000000000002', 'demo-client-12', 4, 'Very good, slightly short warm-up.', interval '60 days'),
  ('f0000000-0000-4000-8000-000000000003', 'demo-client-13', 5, 'Huge presence, safe and controlled.', interval '9 days'),
  ('f0000000-0000-4000-8000-000000000003', 'demo-client-14', 4, 'Strong session, a bit expensive for a Duel.', interval '33 days'),
  ('f0000000-0000-4000-8000-000000000003', 'demo-client-15', 5, 'Exactly what our seminar needed.', interval '48 days'),
  ('f0000000-0000-4000-8000-000000000004', 'demo-client-16', 4, 'Quick feet, hard to catch.', interval '22 days'),
  ('f0000000-0000-4000-8000-000000000004', 'demo-client-17', 5, 'Best sparring partner I have booked so far.', interval '39 days'),
  ('f0000000-0000-4000-8000-000000000005', 'demo-client-18', 3, 'Strong, but arrived without gloves.', interval '14 days'),
  ('f0000000-0000-4000-8000-000000000005', 'demo-client-19', 5, 'Great energy during the Show.', interval '27 days'),
  ('f0000000-0000-4000-8000-000000000006', 'demo-client-20', 5, 'Technical and very respectful.', interval '44 days')
) AS r (fighter_id, client, rating, comment, age);
