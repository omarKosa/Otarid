# Otarid Microservices Platform

A Node.js microservices monorepo for authentication, user profiles, notifications, and a React frontend.

## Overview

This repository includes:
- `authentication-service/` — auth, registration, login, JWT tokens, password reset, and internal service auth.
- `profile-service/` — profile CRUD, avatar uploads, profile metadata, and protected profile API.
- `notification-service/` — RabbitMQ consumer for email notifications.
- `api-gateway/` — gateway/proxy for the auth and profile services.
- `otarid-frontend/` — React SPA for login, profile management, and password reset.
- `shared/` — shared utilities and models used across services.

## Architecture

The system is designed as a microservices stack:
- `api-gateway` exposes a single entry point on `http://localhost:3000`
- `authentication-service` runs on port `5001`
- `profile-service` runs on port `5002`
- `notification-service` runs on port `5003`
- `auth-db` and `profile-db` are PostgreSQL databases managed by Docker Compose
- RabbitMQ is expected to be available externally on `host.docker.internal:5672`

## Services

### `authentication-service`
- Handles user registration, login, logout, refresh tokens
- Issues JWT access tokens
- Manages password reset emails
- Communicates with `profile-service` and publishes events for notifications

### `profile-service`
- Manages user profiles and avatars
- Protects profile routes with JWT authorization
- Stores profile state in PostgreSQL

### `notification-service`
- Subscribes to RabbitMQ events
- Sends transactional emails via SMTP

### `api-gateway`
- Routes client requests to auth/profile services
- Applies shared security, logging, and CORS policies

### `otarid-frontend`
- React frontend for authentication workflows and profile management
- Consumes the gateway API

## Quick Start with Docker Compose

Requirements:
- Docker
- Docker Compose
- External RabbitMQ broker available on `localhost:5672` (or `host.docker.internal:5672` from Docker)

Start the full stack:

```bash
docker compose up --build
```

This launches:
- `auth-db` → PostgreSQL for authentication data
- `profile-db` → PostgreSQL for profile data
- `auth-service`
- `profile-service`
- `notification-service`
- `api-gateway`

Visit the frontend at `http://localhost:3000` once the stack is ready.

## Local Development

Each service has its own dependencies and `.env` file.

Example workflow:

```bash
cd authentication-service
npm install
npm run dev
```

```bash
cd profile-service
npm install
npm run dev
```

```bash
cd notification-service
npm install
npm run dev
```

```bash
cd api-gateway
npm install
npm run dev
```

```bash
cd otarid-frontend
npm install
npm start
```

## Ports

| Service | Local Port | Notes |
|---|---|---|
| `api-gateway` | `3000` | Frontend gateway |
| `auth-service` | `5001` | Auth API |
| `profile-service` | `5002` | Profile API |
| `notification-service` | `5003` | Notification worker |
| `auth-db` | `5432` | Auth PostgreSQL |
| `profile-db` | `5433` | Profile PostgreSQL |

## Environment Variables

Each service loads environment variables from its own `.env` file.

Common variables used by services include:

- `PORT`
- `NODE_ENV`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `AUTH_SERVICE_URL`
- `PROFILE_SERVICE_URL`
- `INTERNAL_API_KEY`
- `RABBITMQ_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `CLIENT_URL`

Follow each service folder for more detailed env variable names and examples.

## API Gateway Endpoints

The gateway proxies auth and profile endpoints through `http://localhost:3000`.

| Method | Path | Purpose | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Log in and receive access token | No |
| `POST` | `/auth/logout` | Log out and clear refresh session | Yes |
| `POST` | `/auth/refresh-token` | Refresh access token | Yes (refresh cookie) |
| `POST` | `/auth/forgot-password` | Request password reset email | No |
| `PATCH` | `/auth/reset-password/:token` | Reset password using token | No |
| `GET` | `/auth/me` | Get authenticated user info | Yes |
| `GET` | `/profile` | Get current profile | Yes |
| `PATCH` | `/profile` | Update profile data | Yes |
| `POST` | `/profile/avatar` | Upload or replace avatar image | Yes |
| `DELETE` | `/profile/avatar` | Remove profile avatar | Yes |
| `PATCH` | `/profile/change-password` | Change account password | Yes |
| `DELETE` | `/profile/delete-account` | Delete the user account | Yes |
| `GET` | `/health` | Service health check | No |

## Notes

- The repo is a monorepo; services are isolated and can run independently.
- `notification-service` relies on RabbitMQ events and does not expose public REST endpoints.
- The `shared/` folder contains common models and utilities.
- Frontend assets are contained in `otarid-frontend/` and can call the gateway at `http://localhost:3000`.

## Testing

Each service defines its own test scripts. For example:

```bash
cd profile-service
npm run test
```

## License

MIT
