# UberCastagne

## Démarrage

Lancer l'ensemble du projet en mode développement :

```bash
docker compose up --build
```

- Frontend React : http://localhost:5173
- Backend Vite : http://localhost:3000/api/health

Les dossiers `front` et `back` sont montés comme volumes Docker : les changements locaux sont pris en compte sans reconstruire les images.

Pour exécuter les applications sans Docker, installer les dépendances dans chaque dossier puis lancer `npm run dev`.
