# Profile Multi-service System

A Node.js + express REST API for user profile management, with **PostgreSQL** database via **Sequelize** ORM.

-----

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Auth:** JWT (Access + Refresh Tokens)
- **Password Hashing:** bcryptjs
- **File Uploads:** Multer + Sharp
- **Email:** Nodemailer
- **Validation:** express-validator
- **Security:** Helmet, CORS, express-rate-limit

-----

## Project Structure

```
auth-microservice/
├── .env.example
├── package.json
├── src/
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── profileController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validators.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── profileRoutes.js
│   └── utils/
│       ├── email.js
│       ├── jwt.js
│       └── upload.js
```

-----

## How To Run

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
```
then open `.env` and fill in your values (env section is below).

### 3. Create the PostgreSQL database
```bash
createdb auth_microservice
```

### 4. Start the development server
```bash
npm run dev
```

on first boot, Sequelize will automatically create the `users` table. You will see:
```
✅ PostgreSQL connected successfully.
✅ Database models synced.
✅ Server running in development mode on port 5000
```

### 5. Start
```bash
npm start
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the values below.

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server runs on | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `auth_microservice` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `yourpassword` |
| `DB_SSL` | Enable SSL for DB | `false` |
| `JWT_SECRET` | Secret for access tokens | `changeme` |
| `JWT_EXPIRE` | Access token expiry | `15m` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `changeme` |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry | `7d` |
| `SMTP_HOST` | SMTP server host | `smtp.mailtrap.io` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `EMAIL_FROM` | Sender email address | `noreply@yourapp.com` |
| `CLIENT_URL` | Your frontend URL | `http://localhost:3000` |
| `UPLOAD_PATH` | Where avatars are stored | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `5242880` (5MB) |

-----

##  API Endpoints

**Base URL:** `http://localhost:5000/api/v1`

-----

```
| Method | Route | Purpose | Key Inputs | Response |
|--------|-------|---------|------------|----------|
| **Auth** | | | | |
| `POST` | `/auth/register` | Create account | `name`, `email`, `password` | `201` · accessToken + user |
| `POST` | `/auth/login` | Login | `email`, `password` | `200` · accessToken + user |
| `POST` | `/auth/logout` | End session | — | `200` · clears refresh cookie |
| `POST` | `/auth/refresh-token` | Renew access token | `refreshToken` (cookie or body) | `200` · new accessToken |
| `POST` | `/auth/forgot-password` | Request reset email | `email` | `200` · always (anti-enum) |
| `PATCH` | `/auth/reset-password/:token` | Set new password | `password`, reset token (URL) | `200` · success message |
| `GET` | `/auth/me` | Get current user | Bearer token | `200` · user object |
| **Profile** | | *(all require Bearer token)* | | |
| `GET` | `/profile` | Fetch profile | — | `200` · profile object |
| `PATCH` | `/profile` | Update profile | `name`?, `bio`?, `email`? | `200` · updated profile |
| `POST` | `/profile/avatar` | Upload avatar | multipart · `avatar` (JPEG/PNG/WebP ≤5MB) | `200` · resized to 200×200 WebP |
| `DELETE` | `/profile/avatar` | Remove avatar | — | `200` · avatar cleared |
| `PATCH` | `/profile/change-password` | Change password | `currentPassword`, `newPassword` | `200` · other sessions logged out |
| `DELETE` | `/profile/delete-account` | Delete account | `password` (confirmation) | `200` · account removed |
| `GET` | `/health` | Health check | — | `200` · status + timestamp |
```

-----

## Security Features

- **Helmet** — sets secure HTTP response headers
- **CORS** — only allows requests from `CLIENT_URL`
- **Rate limiting** — 10 requests / 15 min on auth routes, 5 requests / hour on password reset
- **bcryptjs** — passwords hashed with cost factor 12
- **HttpOnly cookies** — refresh tokens stored in Secure, SameSite=Strict cookies
- **Refresh token rotation** — tokens are rotated on every use; max 5 stored per user
- **Session invalidation** — all refresh tokens are wiped on password change or reset
- **Email enumeration protection** — forgot-password always returns 200
- **Input validation** — all inputs validated with express-validator
- **Body size limit** — JSON bodies capped at 10kb

---

## Database

PostgreSQL with Sequelize ORM. The `users` table is created automatically when you start the server in development mode (`NODE_ENV=development`).

**Users table columns:**

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, auto-generated |
| `name` | VARCHAR(50) | Required |
| `email` | VARCHAR | Required, unique |
| `password` | VARCHAR | Hashed with bcrypt |
| `avatar` | VARCHAR | Path to uploaded file |
| `bio` | VARCHAR(200) | Optional |
| `role` | ENUM | `user` or `admin` |
| `isActive` | BOOLEAN | Default true |
| `refreshTokens` | JSONB | Array of `{ token, createdAt }` |
| `passwordResetToken` | VARCHAR | Hashed reset token |
| `passwordResetExpires` | TIMESTAMP | 10 minute expiry |
| `passwordChangedAt` | TIMESTAMP | Used to invalidate old JWTs |
| `createdAt` | TIMESTAMP | Auto-managed |
| `updatedAt` | TIMESTAMP | Auto-managed |

-----

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart on changes) |
| `npm start` | Start in production mode |
