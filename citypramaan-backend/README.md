# CityPramaan Backend

Real Express + TypeScript API for CityPramaan with persisted local storage, password authentication, email OTP verification, wallet challenge authentication, JWT access tokens, rotating refresh tokens, role checks, issue CRUD, contractor records, warranty approval, and uploads.

## Run

```bash
cd citypramaan-backend
cp .env.example .env
npm install
npm run dev
```

The API starts on `http://localhost:5000`.

Runtime data is written to `citypramaan-backend/data/citypramaan-db.json`. Uploads are stored under `citypramaan-backend/data/uploads` unless Pinata keys are configured.

## Auth

Register:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"citizen@example.com\",\"password\":\"password123\",\"name\":\"Citizen One\",\"contactNumber\":\"+919999999999\",\"role\":\"USER\"}"
```

The account is created with `emailVerified: false`. A 6-digit code is emailed through Resend or SMTP. In local development without an email provider, the code is printed to the server console and returned as `devVerificationCode`.

Verify email:

```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"citizen@example.com\",\"code\":\"123456\"}"
```

The verify response includes the first real `accessToken` and `refreshToken`.

Resend code:

```bash
curl -X POST http://localhost:5000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"citizen@example.com\"}"
```

Login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"citizen@example.com\",\"password\":\"password123\"}"
```

Use `accessToken` as a bearer token:

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Refresh tokens rotate on every refresh:

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"REFRESH_TOKEN\"}"
```

Wallet login is challenge based:

```bash
curl -X POST http://localhost:5000/api/auth/wallet/challenge \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"0x0000000000000000000000000000000000000000\"}"
```

Sign the returned `message`, then post `walletAddress`, `message`, and `signature` to `/api/auth/wallet/verify`.

## Main Endpoints

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`
- `GET /api/auth/me`, `PATCH /api/auth/me`
- `POST /api/auth/wallet/challenge`, `POST /api/auth/wallet/verify`
- `GET /api/issues`, `GET /api/issues/stats`, `GET /api/issues/:id`
- `POST /api/issues` with bearer token
- `PATCH /api/issues/:id` with bearer token and role-aware authorization
- `GET /api/contractors`, `GET /api/contractors/:id`
- `PATCH /api/contractors/:id/availability` with contractor or ward-admin token
- `POST /api/warranty/:issueId/submit-proof` with contractor or ward-admin token
- `POST /api/warranty/:issueId/approve` with ward-admin token
- `POST /api/upload/issue-image`, `POST /api/upload/proof-bundle`

## Production Notes

Set a strong `JWT_SECRET` and a real email provider. Production refuses console-only OTP delivery.

On Render free web services, prefer Resend:

```env
RESEND_API_KEY=re_...
RESEND_FROM=CityPramaan <no-reply@yourdomain.com>
```

Leave `SMTP_*` blank unless your host allows outbound SMTP or your SMTP provider supports an unblocked port. Gmail SMTP uses ports `465` or `587`, which are blocked for Render free web services.

If `ADMIN_INVITE_CODE` or `CONTRACTOR_INVITE_CODE` is set, self-registration for those roles must include the matching `inviteCode`.
