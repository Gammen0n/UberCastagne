-- Données de démonstration. Identifiants fixes pour pouvoir les citer dans les tests.

INSERT INTO venues (id, manager_email, name, address, postal_code, city, latitude, longitude, capacity, disciplines) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'gerant.pau@castagne.local', 'Club Pugilistique Palois',
   '12 rue des Cordeliers', '64000', 'Pau', 43.29510, -0.37080, 80, '{BOXING,KICKBOXING,MUAY_THAI}'),
  ('b0000000-0000-4000-8000-000000000002', 'gerant.bayonne@castagne.local', 'Club Bayonne Combat',
   '5 quai Amiral Jauréguiberry', '64100', 'Bayonne', 43.49290, -1.47480, 120, '{BOXING,MUAY_THAI,MMA,JUDO}'),
  ('b0000000-0000-4000-8000-000000000003', 'gerant.toulouse@castagne.local', 'Octogone Toulousain',
   '48 allée Jean Jaurès', '31000', 'Toulouse', 43.60720, 1.44960, 200, '{MMA,WRESTLING,KICKBOXING}'),
  ('b0000000-0000-4000-8000-000000000004', 'gerant.bordeaux@castagne.local', 'Ring des Chartrons',
   '30 cours Portal', '33000', 'Bordeaux', 44.85360, -0.57040, 60, '{BOXING,KICKBOXING}');

-- Créneaux de 2 h (18 h – 20 h et 20 h 30 – 22 h 30, heure de Paris) les vendredis et samedis des quatre prochaines semaines.
INSERT INTO slots (venue_id, period, price_cents)
SELECT v.id,
       tstzrange((d + s.start_at) AT TIME ZONE 'Europe/Paris', (d + s.start_at + interval '2 hours') AT TIME ZONE 'Europe/Paris'),
       CASE WHEN v.capacity >= 150 THEN 15000 WHEN v.capacity >= 100 THEN 10000 ELSE 7000 END
FROM venues v
CROSS JOIN generate_series(current_date + 3, current_date + 30, interval '1 day') AS g(day)
CROSS JOIN LATERAL (SELECT g.day::date AS d) AS x
CROSS JOIN (VALUES (time '18:00'), (time '20:30')) AS s(start_at)
WHERE extract(isodow FROM d) IN (5, 6);
