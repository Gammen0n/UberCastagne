# UberCastagne

## Démarrage

Lancer l'ensemble du projet en mode développement :

```bash
cp .env.example .env   # une seule fois, puis changer les mots de passe
docker compose up --build
```

- Frontend React : http://localhost:5173
- Backend Vite : http://localhost:3000/api/health

Les dossiers `front` et `back` sont montés comme volumes Docker : les changements locaux sont pris en compte sans reconstruire les images.

Pour exécuter les applications sans Docker, installer les dépendances dans chaque dossier puis lancer `npm run dev`.

## Base de données

Un serveur PostgreSQL héberge une base par service (`orders`, `catalogue`, `venues`, `payment`). Chaque base a son propre rôle (`<base>_svc`), qui n'a pas accès aux autres bases (ADR-04).

- `db/init/00-init.sh` crée les rôles et les bases, puis exécute les scripts de `db/sql/<base>/` dans l'ordre.
- `db/sql/<base>/01-schema.sql` contient les tables et `02-seed.sql` les données de démonstration.

Les scripts ne s'exécutent **qu'au premier démarrage**, quand le volume est vide. Pour repartir de zéro après une modification :

```bash
docker compose down -v
docker compose up --build
```

Connexion depuis la machine : `localhost:5432`, par exemple `psql -h localhost -U catalogue_svc catalogue`.

### Données de démonstration

Créneaux et disponibilités : vendredis et samedis des quatre semaines qui suivent l'initialisation.

| Base | Contenu |
|------|---------|
| `catalogue` | 8 combattants (6 approuvés, 1 en attente, 1 suspendu), leurs tarifs Duel/Show, leurs disponibilités 17 h – 23 h, 20 avis (la note est la moyenne des avis, tenue à jour par un trigger) |
| `venues` | 4 salles (Pau, Bayonne, Toulouse, Bordeaux), 2 créneaux de 2 h par soirée |
| `orders` | 5 arbitres (4 actifs, 1 inactif) ; aucune commande |
| `payment` | tables vides |

Les comptes utilisateurs (clients, combattants, gérants, arbitres, admin) vivent dans Zitadel. Les tables applicatives gardent l'e-mail du compte et une colonne `user_id` (claim `sub` de Zitadel) à remplir une fois les comptes créés. Les e-mails de démonstration sont en `@castagne.local`.
