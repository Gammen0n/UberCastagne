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

- `db/init/00-init.sh` crée les rôles, les bases et les extensions, au tout premier démarrage (volume vide).
- `db/migrations/<base>/` contient le schéma, en fichiers numérotés (`001_initial.sql`, `002_…`).
- `db/seeds/<base>/` contient les données de démonstration.
- Le service `migrate` applique ce qui manque à **chaque** `docker compose up`, avant le back. Il note ce qui est fait dans la table `schema_migrations` de chaque base.

### Modifier le schéma

1. Créer un **nouveau** fichier dans la bonne base, avec le numéro suivant : `db/migrations/catalogue/002_add_fighter_nickname.sql`.
2. Y écrire le changement (`ALTER TABLE …`, `CREATE INDEX …`). Le fichier s'exécute dans une transaction : s'il échoue, rien n'est appliqué et le back ne démarre pas.
3. Lancer `docker compose up -d` (ou `docker compose run --rm migrate`). Les données existantes sont conservées.

Ne jamais modifier une migration déjà appliquée : le service `migrate` s'arrête avec une erreur, car le changement n'atteindrait jamais les bases existantes. Écrire une nouvelle migration à la place.

Pour repartir de données de démonstration neuves : `docker compose down -v`, puis `docker compose up -d`. Pour démarrer sans données de démonstration, passer `DEMO_SEED` à `"false"` dans `compose.yaml`.

Connexion depuis la machine : `localhost:5432` (ou le port `POSTGRES_HOST_PORT` du `.env`), par exemple `psql -h localhost -U catalogue_svc catalogue`.

### Données de démonstration

Créneaux et disponibilités : vendredis et samedis des quatre semaines qui suivent l'initialisation.

| Base | Contenu |
|------|---------|
| `catalogue` | 8 combattants (6 approuvés, 1 en attente, 1 suspendu), leurs tarifs Duel/Show, leurs disponibilités 17 h – 23 h, 20 avis (la note est la moyenne des avis, tenue à jour par un trigger) |
| `venues` | 4 salles (Pau, Bayonne, Toulouse, Bordeaux), 2 créneaux de 2 h par soirée |
| `orders` | 5 arbitres (4 actifs, 1 inactif) ; aucune commande |
| `payment` | tables vides |

Les comptes utilisateurs (clients, combattants, gérants, arbitres, admin) vivent dans Zitadel. Les tables applicatives gardent l'e-mail du compte et une colonne `user_id` (claim `sub` de Zitadel) à remplir une fois les comptes créés. Les e-mails de démonstration sont en `@castagne.local`.
