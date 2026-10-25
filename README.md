# Authentication Starter

Session-based auth for Express 5 + PostgreSQL. Instead of rebuilding login for every new project, copy this in: each app keeps its own users, sessions and secrets, and gets tested, hardened auth from day one.

## What it does

- `POST /auth/register`: Argon2id password hashing, case-insensitive unique emails
- `POST /auth/login`: sets an `httpOnly` session cookie; rate-limited to 10 failed attempts per 15 min per IP
- `GET /auth/me`: returns the current user (`requireAuth` middleware)
- `POST /auth/logout`: deletes the session server-side and clears the cookie

## Security

| Attack | Defence |
|---|---|
| Stolen database: crack passwords | Argon2id with a random salt per password, so it's slow to crack and identical passwords hash differently |
| Stolen database: hijack sessions | Session tokens are 32 random bytes; only their SHA-256 hash is stored, so a leaked `sessions` table can't be turned back into a working cookie |
| Find which emails have accounts via login | Unknown emails still run a full password check against a dummy hash, so response time is the same; error message is identical too |
| Password guessing | 10 failed logins per IP per 15 minutes, then `429` |
| XSS stealing the session | Cookie is `httpOnly` (JavaScript can't read it) and `Secure` in production |
| CSRF | `SameSite=Lax` cookie: other sites can't send it with their POST requests |
| Session that outlives logout | Sessions live server-side; logout deletes the row, so a copied cookie stops working |
| SQL injection | Every query is parameterised (`$1`, `$2`) |
| Duplicate accounts (`A@x.com` vs `a@x.com`) | Unique index on `lower(email)` |
| Huge inputs / hashing DoS | Zod caps email at 254 and password at 128 chars |
| Leaking internals | Central error handler returns a generic 500, never a stack trace |

Known gap: `register` returns `409` for a taken email, so registration can still reveal whether an email exists.

## Run it

```sh
cp .env.example .env
docker compose up -d
pnpm install
pnpm --filter demo migrate up
pnpm dev
```

## Test

```sh
pnpm --filter demo test
```

Tests hit the real database from `.env` and delete their own `test-*@example.com` users afterwards.

## Not done yet

- Expired sessions are never deleted from the table
- Rate limiter is in-memory, so limits are per process
- Not yet extracted into `packages/auth-core`
