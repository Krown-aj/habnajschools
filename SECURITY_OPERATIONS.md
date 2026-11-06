# Security Operations Notes

These notes cover the application secrets needed to operate the current system. Store secret values in a local ignored `.env` file for development and in the deployment provider's encrypted environment settings for hosted environments. Never commit, paste into chat, or include secret values in logs.

## NextAuth session secret

The installed NextAuth v4 uses `NEXTAUTH_SECRET` to sign and encrypt session tokens. The installed version also accepts `AUTH_SECRET` as a fallback; use `NEXTAUTH_SECRET` consistently for this application. Configure it in each environment that runs the application:

- Local development: the developer's ignored `.env` file.
- Preview deployments: a dedicated preview secret.
- Production: a dedicated production secret in the hosting provider's encrypted environment settings.

Use a different, randomly generated value in each environment. Do not use a human password, reuse the database password, or share the production value with local development or preview deployments. Generate at least 32 random bytes with Node.js:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Copy the generated value directly into the appropriate secret store and do not commit it. For Vercel deployments, configure the variable on the correct Production, Preview, or Development environment. Vercel applies environment changes to new deployments, so follow the team's release process to make a change active.

### Rotation procedure

1. Generate a new random secret for the environment being rotated.
2. Replace that environment's `NEXTAUTH_SECRET` in its encrypted settings. Do not put the value in source control or send it to another person in plain text.
3. Deploy/restart through the approved release process so the application receives the new setting.
4. Verify sign-in, session creation, and sign-out using a test account in that environment.
5. Expect existing sessions to become invalid and users to sign in again. Schedule rotation when that impact is acceptable.
6. Remove the old value from any managed secret history according to the hosting provider's controls and the organization's secret-retention policy.

Never rotate the production secret as an informal troubleshooting step. Coordinate the user sign-in impact and use the deployment process that the school has approved.

## Password setup

- New administrator, teacher, student, and parent passwords must be at least 12 characters. The sign-in screen remains compatible with shorter passwords already in use; existing users are not forced to change passwords by this validation update.
- Account-creation forms require an administrator-entered password instead of assigning the shared value `password`. Administrators should choose a unique password for each account, share it privately with the user, and ask the user to change it after the first sign-in.
- Passwords are hashed with bcrypt before database storage. Never record or send a password through public or group channels.

## Sessions and account changes

- Sessions expire after eight hours.
- A session is checked against the account's active status, role, and password hash version when NextAuth loads it. Deactivated accounts, role changes, and password changes invalidate active sessions without adding a database column.
- The session-token version was raised to invalidate tokens issued before this check existed. When this change is deployed, existing users will need to sign in again once. Password changes also invalidate other sessions when those sessions next load.
- The current version comparison uses the stored bcrypt hash only to derive a one-way fingerprint; the password hash is never returned to the browser.

## Shared rate-limit store (Vercel / Upstash Redis)

The application uses Upstash Redis through Vercel Marketplace so counters are shared across serverless instances. Production sign-in and password changes fail closed if the store variables are missing or Redis cannot be reached; connect the store before deploying this code.

1. In the Vercel dashboard, open the Habnaj project and select **Storage** or **Integrations**.
2. Add the **Upstash for Redis** integration, select/create a Redis database, and link it to this Vercel project.
3. Ensure the integration injects a writable REST URL/token pair for **Production**: either `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, or `KV_REST_API_URL` + `KV_REST_API_TOKEN`. The app supports both pairs. `KV_REST_API_READ_ONLY_TOKEN` cannot be used because rate limiting must write counters. `KV_URL` and `REDIS_URL` are connection URLs, not REST credentials for this HTTP-based SDK. If the integration only exposes the read-only token, create a write-enabled REST token in the Upstash database settings and add it as the sensitive Vercel variable `KV_REST_API_TOKEN`. Add the writable pair to Preview only if preview sign-in should also enforce rate limits. Do not paste any value into chat, source files, or committed environment files.
4. Create or use a separate development Redis database and set a writable REST URL/token pair in the local ignored `.env` file. Keep development and production databases separate.
5. Trigger a deployment only after Vercel shows both Production variables. Then verify sign-in, password changes, and rate-limit behavior with a test account. Repeated attempts should be stopped after the configured thresholds.

Current thresholds: 20 sign-in attempts per source IP and 10 per normalized account identifier per 10 minutes; 5 password-change attempts per signed-in account per 10 minutes. Account/IP identifiers are SHA-256 hashed before use as Redis keys. Local development bypasses enforcement while variables are absent so development remains usable; production fails closed. Redis counters may contain hashed identifiers and timestamps, not raw usernames or passwords.

## Database and Dropbox credentials

- `DATABASE_URL` connects the server to PostgreSQL. Keep it server-side and use separate databases/credentials for development, staging, and production where available.
- `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, and `DROPBOX_REFRESH_TOKEN` are server integration credentials. Do not expose the app secret or refresh token to browser code. Rotate Dropbox credentials through the Dropbox app settings and redeploy through the approved process.
- The former `/api/dropbox/callback` echoed OAuth authorization codes and had no state validation. That callback is disabled (410) until a complete server-side OAuth flow with state validation and secure token storage is implemented. Do not use this endpoint to configure Dropbox.
- `/api/dropbox/token` currently requires a signed-in session but still returns a Dropbox access token to the browser for existing image upload/display clients. Restricting the endpoint further does not solve token exposure; migrate those operations to scoped server-side upload/display endpoints before considering this integration fully protected.
- Use the hosting provider's encrypted variables for deployed credentials; do not add real values to `.env.example`, source files, build logs, screenshots, or issue descriptions.

## Current verification boundary

- The app sends `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, a six-month HSTS policy, a strict-origin referrer policy, and a permissions policy disabling camera, microphone, and geolocation access. Middleware rejects malformed or cross-origin `Origin` headers on API mutations; API handlers remain responsible for authentication and authorization. Verify these headers and same-origin mutations after deployment.

## Draft permission target

This target reflects the workflows the school confirmed. It is not a claim that every route already enforces the matrix. The app currently has `super`, `admin`, and `management` staff roles, but no dedicated school-office role; the proprietor's account role and the mapping for fee-office staff still need to be established before the matrix can be enforced completely.

| Resource/action | Intended owner and access |
| --- | --- |
| School policy and access decisions | Proprietor decides policy. The account role that represents the proprietor must be confirmed. |
| Enrollment and official student identity | Admin creates and maintains records. Teachers use scoped academic views; students and parents see only their own/linked records. |
| Fees and payment corrections | School office records and corrects fees in the app. The app's staff role for this office must be confirmed; parents/students should see only their own fee records. |
| Attendance | Teachers record attendance for assigned classes/lessons. Students and parents read their own/linked records. Staff corrections should be limited and audited. |
| Grades and report cards | Teachers enter marks for assigned class/subject pairs. Students and parents read only their own/linked published results. Publication and correction authority needs proprietor confirmation. |
| Accounts and system configuration | Administer only through an explicitly authorized staff role; privileged account changes and exports should be audited. |

Do not grant the `management` role fee or enrollment authority by assumption. Confirm its intended scope and whether the school-office team should receive a separate role before enabling fee workflows.

Source code and the installed NextAuth package were reviewed. The user confirmed that `NEXTAUTH_SECRET` is set in Vercel Production. Its random strength, minimum length, separation from Local/Preview, and rotation history have **not** been verified. Confirm those properties in Vercel without disclosing the values before enforcing a new production startup check or rotating a live secret.
