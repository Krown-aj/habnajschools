# Habnaj International School Information System

Habnaj International is a school management web application for managing school records and day-to-day academic workflows. It provides role-based dashboards for administrators, teachers, students, and parents.

## Main features

- Manage students, parents, teachers, administrators, classes, and subjects.
- Set up academic sessions, terms, grading policies, assessments, and student traits.
- Enter grades, record attendance, and generate report cards.
- Manage lessons, assignments, tests, events, announcements, school news, and gallery content.
- Let parents and students view relevant academic information through their dashboards.
- Upload and display files and images using Dropbox integration.

## Roles

- **Super administrator:** system-wide administration and configuration.
- **Administrator and management:** school records, academic setup, and reporting.
- **Teacher:** teaching, attendance, grading, and student-related workflows.
- **Student:** personal dashboard and academic information.
- **Parent:** linked students and their academic information.

Access is implemented in two places: dashboard pages are role-checked by Next.js middleware, and API route handlers perform their own session and role checks. The handlers use the signed-in identity to apply record-level access rules where implemented.

## Technology

- Next.js App Router and React
- TypeScript
- NextAuth credentials authentication with JWT sessions
- Prisma ORM and PostgreSQL
- Zod request validation, React Hook Form, and TanStack React Query
- Dropbox API for file storage and image links

## Local development

### Requirements

- Node.js compatible with the versions of Next.js and Prisma in `package.json`
- npm
- A PostgreSQL database

### Configure environment

Create a `.env` file in the project root. Set the database connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Authentication and file upload features also require the corresponding NextAuth and Dropbox settings used by the application. Keep real credentials out of source control; use your deployment platform's secret manager in production.

### Install and run

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser. The `postinstall` script also generates the Prisma client after dependency installation.

## Project layout

```text
prisma/                 Prisma schema, migrations, and seed script
src/app/                Next.js pages, layouts, and API routes
src/features/           Dashboard and public-site feature components
src/components/         Shared interface components
src/hooks/              Client data hooks
src/lib/                Authentication, Prisma, validation, and API helpers
src/types/              Shared TypeScript declarations
```

The Prisma schema is the source of truth for persisted data. Database changes should be represented by migrations in `prisma/migrations/`.

## Useful commands

```bash
npm run dev       # Start the development server
npm run build     # Build the production application
npm run start     # Serve a production build
npx prisma studio # Open Prisma Studio
```

The project does not currently define a test script in `package.json`.
