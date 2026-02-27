# 🔐 User Authentication & Profile Microservice

A production-ready Node.js + Express REST API for user authentication and profile management, backed by **PostgreSQL** via Sequelize ORM.

---

## 🧱 Tech Stack

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

---

## 📁 Project Structure

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

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
```
Then open `.env` and fill in your values (see Environment Variables section below).

### 3. Create the PostgreSQL database
```bash
createdb auth_microservice
```

### 4. Start the development server
```bash
npm run dev
```

On first boot, Sequelize will automatically create the `users` table. You should see:
```
✅ PostgreSQL connected successfully.
✅ Database models synced.
🚀 Server running in development mode on port 5000
```

### 5. Start in production
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

---

## 📡 API Reference

**Base URL:** `http://localhost:5000/api/v1`

---

### 🔑 Auth Endpoints

#### POST `/auth/register`
Register a new user.

**Request body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass1"
}
```

**Response `201`:**
```json
{
  "success": true,
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatar": null,
    "bio": "",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### POST `/auth/login`
Login with email and password.

**Request body:**
```json
{
  "email": "jane@example.com",
  "password": "SecurePass1"
}
```

**Response `200`:**
```json
{
  "success": true,
  "accessToken": "eyJhbGci...",
  "user": { ... }
}
```

---

#### POST `/auth/logout` 🔒
Logout the current session. Clears the refresh token cookie.

**Response `200`:**
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

#### POST `/auth/refresh-token`
Get a new access token using the refresh token.

The refresh token is read automatically from the `refreshToken` HttpOnly cookie. Alternatively, pass it in the request body:

```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response `200`:**
```json
{
  "success": true,
  "accessToken": "eyJhbGci...",
  "user": { ... }
}
```

---

#### POST `/auth/forgot-password`
Request a password reset email.

**Request body:**
```json
{
  "email": "jane@example.com"
}
```

**Response `200`:** *(always 200 to prevent email enumeration)*
```json
{
  "success": true,
  "message": "If that email exists, a reset link has been sent."
}
```

---

#### PATCH `/auth/reset-password/:token`
Reset the password using the token from the email link.

**Request body:**
```json
{
  "password": "NewSecurePass1"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Password reset successful. Please log in."
}
```

---

#### GET `/auth/me` 🔒
Get the currently authenticated user.

**Response `200`:**
```json
{
  "success": true,
  "user": { ... }
}
```

---

### 👤 Profile Endpoints

All profile endpoints require a valid `Authorization: Bearer <token>` header.

---

#### GET `/profile` 🔒
Get the current user's profile.

---

#### PATCH `/profile` 🔒
Update name, bio, or email.

**Request body** (all fields optional):
```json
{
  "name": "Jane Smith",
  "bio": "Software engineer based in NYC",
  "email": "jane.smith@example.com"
}
```

---

#### POST `/profile/avatar` 🔒
Upload a profile avatar.

- Content type: `multipart/form-data`
- Field name: `avatar`
- Accepted formats: JPEG, PNG, WebP
- Max size: 5MB
- Images are automatically resized to **200×200px** and converted to **WebP**

---

#### DELETE `/profile/avatar` 🔒
Remove the current avatar.

---

#### PATCH `/profile/change-password` 🔒
Change the account password. Logs out all other sessions.

**Request body:**
```json
{
  "currentPassword": "OldPass1",
  "newPassword": "NewPass1"
}
```

---

#### DELETE `/profile/delete-account` 🔒
Permanently delete the account. Requires password confirmation.

**Request body:**
```json
{
  "password": "CurrentPass1"
}
```

---

## 🔒 Security Features

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

## 🗄️ Database

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

---

## 🩺 Health Check

```
GET /health
```

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 📦 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart on changes) |
| `npm start` | Start in production mode |
