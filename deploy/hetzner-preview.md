# Hetzner Preview Deployment

## Goal
Run a pilot preview on a Hetzner EU VPS with Docker Compose. Use HTTPS with an IP-derived domain such as `YOUR_SERVER_IP.sslip.io` when possible.

## Server setup
1. Install Docker and Docker Compose.
2. Copy the repository to the server.
3. Create `.env` from `.env.production.example`.
4. Set `NEXT_PUBLIC_APP_URL` to `https://YOUR_SERVER_IP.sslip.io` or to the final domain.
5. Set `HOSTOPS_DOMAIN` to `YOUR_SERVER_IP.sslip.io`.
6. Run Supabase migrations before starting the app.

If ports `80` and `443` are already used on the VPS, set `HOSTOPS_DOMAIN=:80`, `HOSTOPS_HTTP_PORT=8080`, and `HOSTOPS_HTTPS_PORT=8443` for an HTTP-only smoke preview. Do not use guest PII in that mode.

## Start
```bash
docker compose up -d --build
```

For local compose validation without creating a production `.env` file:

```bash
HOSTOPS_ENV_FILE=.env.local docker compose config
```

## Reverse proxy
- Use Caddy or nginx in front of the app.
- The included `deploy/Caddyfile` forwards public traffic to `hostops-cz:3000`.
- When nginx already owns public `80` and `443`, keep HostOps Compose on `8080` and proxy `https://178.104.197.9.sslip.io` to `http://127.0.0.1:8080`. See `deploy/nginx-hostops-sslip.conf`.
- Do not collect real guest PII over plain HTTP. HTTP is only acceptable for smoke testing.

## Smoke tests
- `/login` loads.
- Admin can sign in.
- `/dashboard` shows Supabase data.
- A guest check-in link opens.
- Ubyport export downloads after a record is approved.
