#!/bin/bash
# Exécuté une seule fois par l'image postgres, au premier démarrage (volume vide).
# Une base et un rôle par service (ADR-04) : aucun rôle ne peut se connecter à la base d'un autre.
# Seul ce qui demande un superutilisateur est fait ici ; les tables viennent des migrations
# (db/migrations), appliquées par le service compose "migrate".
set -euo pipefail

SERVICES=(orders catalogue venues payment)

for svc in "${SERVICES[@]}"; do
  var="$(echo "${svc}" | tr '[:lower:]' '[:upper:]')_DB_PASSWORD"
  password="${!var:?La variable ${var} doit être définie (voir .env.example)}"

  echo "==> Base ${svc}"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
    -v role="${svc}_svc" -v db="${svc}" -v password="${password}" <<-'SQL'
	CREATE ROLE :"role" LOGIN PASSWORD :'password';
	CREATE DATABASE :"db" OWNER :"role";
	REVOKE ALL ON DATABASE :"db" FROM PUBLIC;
	GRANT CONNECT, TEMPORARY ON DATABASE :"db" TO :"role";
SQL

  # Les extensions demandent un superutilisateur.
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${svc}" \
    -c "CREATE EXTENSION IF NOT EXISTS btree_gist;" \
    -c "REVOKE CREATE ON SCHEMA public FROM PUBLIC;" \
    -c "ALTER SCHEMA public OWNER TO ${svc}_svc;"
done
