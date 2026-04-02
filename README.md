# IPAM Microservices System

A learning-focused microservices project for IP Address Management.

This workspace contains:

- `auth-service` (Laravel 12): login + JWT issuance
- `ip-service` (Laravel 12): IP CRUD + audit logs
- `gateway` (Laravel 12): request forwarding (single backend entrypoint)
- `frontend` (Next.js + TypeScript): role-based dashboards

---

## Project overview

This project is a simple IP Address Management platform built as a microservices learning system.

Main idea:

- users authenticate once and receive a JWT
- all app traffic goes through the gateway
- IP operations are handled by the IP service
- every important action is recorded in audit logs

Two roles are implemented:

- `user`: manages only their own IP records
- `super_admin`: can manage all IP records and review audit history

The frontend is intentionally thin and only consumes APIs.
No direct database access is done from the UI layer.

---

## Architecture at a glance

Frontend never talks directly to Auth/IP services.

Request flow:

1. Frontend -> Gateway
2. Gateway -> Auth Service (for auth routes)
3. Gateway -> IP Service (for IP/audit routes)
4. JWT is forwarded via `Authorization: Bearer <token>`

---

## Project structure

```txt
ipam-microservices-system/
  auth-service/
  ip-service/
  gateway/
  frontend/
  docker/
    laravel/Dockerfile
    frontend/Dockerfile
    postgres/init.sql
  docker-compose.yml
  .dockerignore
```

---

## Ports (local)

- Frontend: `http://localhost:3001`
- Gateway: `http://localhost:8000`
- Auth Service: `http://localhost:8001`
- IP Service: `http://localhost:8002`

Note:
- Frontend is on `3001` in Docker because `3000` was already in use.
- Postgres is internal-only in Docker (not published to host).

---

## Quick start (Docker)

From the project root:

```bash
docker compose up --build -d
docker compose ps
```

Run migrations:

```bash
docker compose exec auth-service php artisan migrate --force
docker compose exec ip-service php artisan migrate --force
```

Seed test users:

```bash
docker compose exec auth-service php artisan tinker --execute "\App\Models\User::updateOrCreate(['email' => 'admin@gmail.com'], ['name' => 'Admin','password' => bcrypt('admin@gmail.com'),'role' => 'super_admin']);"

docker compose exec auth-service php artisan tinker --execute "\App\Models\User::updateOrCreate(['email' => 'user@gmail.com'], ['name' => 'User','password' => bcrypt('user@gmail.com'),'role' => 'user']);"
```

Open frontend:

- `http://localhost:3001/login`

---

## Test credentials

- Super Admin:
  - Email: `admin@gmail.com`
  - Password: `admin@gmail.com`
- User:
  - Email: `user@gmail.com`
  - Password: `user@gmail.com`

---

## Key routes

### Gateway routes (used by frontend)

- `POST /api/auth/login`
- `GET /api/ip/ip-addresses`
- `POST /api/ip/ip-addresses`
- `PUT /api/ip/ip-addresses/{id}`
- `DELETE /api/ip/ip-addresses/{id}`
- `GET /api/ip/audit-logs`

Base URL:

- `http://localhost:8000`

Example login:

```http
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "email": "admin@gmail.com",
  "password": "admin@gmail.com"
}
```

---

## Frontend behavior

- Login redirects by role:
  - `super_admin` -> `/admin/audit-logs`
  - `user` -> `/user/dashboard`
- Route protection via `middleware.ts`
  - user cannot access `/admin/*`
  - super_admin cannot access `/user/*`
- Logout clears auth cookie and redirects to `/login`

---

## Role rules implemented

- **User**
  - Can create IPs
  - Can view only own IPs
  - Can update only own IPs
  - Can delete only own IPs
- **Super Admin**
  - Can view all IPs
  - Can update any IP
  - Can delete any IP
  - Can access audit logs dashboard

---

## Audit logs

Audit records include:

- `user_id`
- `action` (`create`, `update`, `delete`, `login`)
- `entity_type`
- `entity_id`
- `old_values`
- `new_values`
- timestamps

Frontend audit table supports:

- action filter
- date range
- search
- sorting
- pagination
- readable change modal (instead of raw JSON)

---

## Rebuild workflow during development

If you change one service, rebuild only that service:

```bash
docker compose up -d --build auth-service
docker compose up -d --build ip-service
docker compose up -d --build gateway
docker compose up -d --build frontend
```

If you changed shared Docker files or compose:

```bash
docker compose up -d --build
```

Useful helpers:

```bash
docker compose ps
docker compose logs -f gateway
docker compose logs -f auth-service
docker compose logs -f ip-service
docker compose down
```

---

## Environment notes

Current frontend env:

- `frontend/.env.local`
  - `GATEWAY_API_BASE_URL=http://127.0.0.1:8000`

Current gateway env (non-docker local run):

- `gateway/.env`
  - `AUTH_SERVICE_URL=http://127.0.0.1:8001`
  - `IP_SERVICE_URL=http://127.0.0.1:8002`

In Docker, service-to-service URLs use service names:

- `http://auth-service:8000`
- `http://ip-service:8000`
- `http://gateway-service:8000`

---

## Common issues and quick fixes

### 1) Frontend not opening on 3000

Use:

- `http://localhost:3001`

### 2) Login returns 500 in Docker

Make sure `auth-service` has `JWT_SECRET` in compose env and container was rebuilt:

```bash
docker compose up -d --build auth-service ip-service gateway
```

### 3) Port already allocated

Another local process is using the port. Change host-side mapping in `docker-compose.yml`.

### 4) DB errors after container reset

Run migrations again:

```bash
docker compose exec auth-service php artisan migrate --force
docker compose exec ip-service php artisan migrate --force
```

---

## What this project is optimized for

- Local learning and iteration
- Clear service boundaries
- Beginner-friendly Docker setup

Not included (yet):

- production hardening
- distributed tracing
- Kubernetes
- advanced gateway policies

---

## Final note

If you are actively developing, treat Docker as a reproducible runtime for all services.
When something breaks, check in this order:

1. `docker compose ps`
2. `docker compose logs -f <service>`
3. migration state
4. env values

That sequence catches almost everything quickly.
