# School Information System Improvement Checklist

Use this as the working backlog for evolving Habnaj International into a dependable, modern school information system. Items are ordered by dependency and impact. Check an item only when its completion criteria are met and the change has been reviewed in the application.

## How to use this list

- `[ ]` Not started; `[x]` Done; add `[~]` while actively working if useful.
- Work through the phases in order. Security and data integrity are prerequisites for safely expanding the system.
- Break large items into smaller issues or pull requests, but keep this file as the high-level record.
- For each completed item, record the date and link to the related issue or pull request in the Notes section at the bottom.
- Confirm behavior with the people who will use the feature (school administration, teachers, students, and parents as appropriate).

## Current progress

- **Current phase:** Phase 1 - protect accounts and school data
- **Next task:** Confirm the Production `NEXTAUTH_SECRET` strength and environment separation (without sharing its value), then continue credential sign-in review.
- **Last updated:** 2026-10-25
- **Phase 0 status:** Complete for implementation kickoff. The proprietor owns decisions; the office handles and will track fees in this app; administrators handle enrollment; teachers handle attendance and grades. The app is the official student and academic record. User reports GitHub pushes trigger production deployment; the public site is hosted on Vercel. Production homepage and sign-in returned HTTP 200; an unauthenticated students API request returned HTTP 401. Parent/student usability representatives and detailed out-of-scope processes are deferred to the relevant workflow design. Production database migration state and backup/restore procedure are hard gates before production schema or data changes.
- **Confirmed scope:** One school.
- **Baseline checks:** TypeScript validation and direct Next.js production build passed. Local runtime smoke check returned `/` 200, `/auth/signin` 200, and unauthenticated `/api/students` 401. Production GET checks returned `/` 200, `/auth/signin` 200, and unauthenticated `/api/students` 401. The standard `npm run build` fails on Windows because its `NODE_OPTIONS` assignment uses Unix shell syntax. No automated test files or test script are currently defined.

## Phase 0 - Establish the baseline

- [x] Name a product owner and core staff workflow contacts. The proprietor owns product decisions; the office, admin, and teachers are identified for fee, enrollment, attendance, and grading workflows. Parent/student representatives will be identified before usability acceptance for those dashboards.
- [x] Agree the current core processes this system is responsible for. Student and academic records, enrollment, attendance, grades, and fee tracking are in scope. The office owns fee tracking, admin owns enrollment, and teachers own attendance and grading. Define ownership for additional workflows when they are prioritized.
- [x] Inventory existing pages, API routes, database models, and external services; classify known features as present, partial, or data-model-only. Whether any feature is unused or planned cannot be determined from source code alone; no feature has been labeled unused or planned without owner input.
- [x] Identify the authoritative source for each important data type (student identity, guardian contacts, enrollment, class placement, attendance, grades, fees). User confirmed this app is the official student and academic record and that fees should be tracked here.
- [x] Record deployment facts visible from the workspace and public site. User reports GitHub pushes deploy production; the public site is served from Vercel. Production GET checks were made only against the public homepage, sign-in page, and unauthenticated API path.
- [x] Decide whether the product is for one school or multiple schools before making data isolation and reporting decisions. (User confirmed one school on 2026-10-04.)

### Initial feature inventory (code presence only)

This is a read-only inventory of files and visible page states, not an end-to-end acceptance test. “Present” means a page or API implementation was found; it does not mean that all permission rules, school workflows, or production behavior have been verified.

| Area | Current code evidence | Initial status |
| --- | --- | --- |
| Student, parent, teacher, administrator, class, subject management | Role dashboard pages and matching API route files exist. | Present; workflow and access checks need review. |
| Terms, grading policies, grading periods, grade entry, traits, results | Dashboard pages, API routes, and Prisma models exist. | Present; calculations, approvals, permissions, and publication need acceptance review. |
| Lessons | Lesson API routes and a super-admin lesson page exist. | Present; role coverage and scheduling behavior need review. |
| Attendance | Prisma model and API routes exist; no dedicated attendance dashboard route was found in the route inventory. | API/data model present; user workflow unclear. |
| Events and announcements | Models and APIs exist, but the super-admin pages display “coming soon” screens. | Partial. |
| Help and privacy settings | Routes exist, but pages display “coming soon” screens. | Partial. |
| News and photo gallery | Public pages and news API routes exist. | Present; publication and content workflows need review. |
| Payments/fees | Payment and payment-setup models exist; no payment API route or payment dashboard route was found. | Data model only; operational workflow not established. |
| Assignments, submissions, tests, questions, answers | Prisma models exist; no matching API route files were found in the current API inventory. | Data model only; operational workflow not established. |

No feature has been labeled unused or planned solely from missing code evidence; those classifications require confirmation from the proprietor or relevant staff.

Production database migration state, backup/restore readiness, and service ownership are not visible in this workspace. They remain mandatory checks before production schema/data changes (see Phase 9). Parent/student usability representatives and supported device expectations are required before the corresponding UX acceptance work (see Phase 6).

## Phase 1 - Protect accounts and school data

### Authentication and account security

- [~] Document strong, unique NextAuth secret requirements and rotation. Added `SECURITY_OPERATIONS.md`. User confirmed `NEXTAUTH_SECRET` is set in Vercel Production; random strength, minimum length, and separation from Local/Preview remain unverified. Do not add a startup guard or rotate until those details are confirmed.
- [~] Review credential sign-in behavior for administrators, teachers, students, and parents, including inactive and passwordless accounts. Source review found inactive accounts returned a distinct error and passwordless accounts could not authenticate. Inactive accounts now receive the same generic invalid-credentials response as unknown usernames and wrong passwords. TypeScript and production build pass; local runtime smoke checks pass. Further credential/reset/session review remains.
- [~] Set a password policy appropriate for staff and family accounts; align password creation and change validation. New and changed passwords now require 12 characters; administrator-entered unique passwords replace the shared `password` default in account creation. Sign-in remains compatible with shorter existing credentials. Enforced first-sign-in password changes and legacy-account cleanup remain open.
- [ ] Add a secure account recovery/reset process that verifies identity and expires reset tokens. The app has no verified email/SMS delivery flow or reset-token persistence; forced temporary-password changes also need a schema-backed flag. Database backup/restore readiness is still unverified, so no migration was run.
- [~] Add rate limiting and monitoring to sign-in, password recovery, and other sensitive endpoints. Added Upstash shared Redis rate limits for sign-in (IP and normalized-account buckets) and password changes; production fails closed if the store is unavailable. Code accepts `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` or `KV_REST_API_URL`/`KV_REST_API_TOKEN`. User reports Vercel has `KV_REST_API_URL`, `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL`, and `REDIS_URL`; writable `KV_REST_API_TOKEN` is not yet confirmed, and the read-only token cannot write rate-limit counters. Recovery endpoints and security monitoring/alerting remain unimplemented.
- [~] Review session expiry, logout, account deactivation, and session invalidation after password or role changes. Session duration is 8 hours; loaded sessions check active status, role, and password-hash fingerprint, and pre-change token versions are invalidated. Production deployment will require all users to sign in once; authenticated production checks and end-to-end user tests remain outstanding.
- [~] Ensure errors do not reveal whether a username/account exists or expose database/internal details. Sign-in now uses generic invalid-credentials responses and API exception handlers return generic messages; validation still returns field-level schema details and a route-by-route error response audit remains. Self-service password changes now require the submitted account type to match the authenticated role.

### Authorization and data minimization

- [~] Create a permission matrix by role, resource, and action (read, create, update, delete, publish, export). Added a draft target based on the confirmed school workflow in `SECURITY_OPERATIONS.md`. The app has no dedicated school-office role and the proprietor/management account mapping and grading publication authority need confirmation before full enforcement.
- [ ] Create shared server-side authorization helpers for both role checks and record-level checks.
- [ ] Review every API handler; confirm it requires authentication where appropriate and checks authorization for the specific requested records.
- [~] Restrict parent access to students linked to that parent; ignore or reject client-supplied parent IDs that do not match the session. Student list/detail, teacher/class/subject lists, and result APIs now scope parent sessions to linked children; attendance is scoped too. Class detail now returns only that parent's children, not the full class roster. Payment and other record endpoints still need review.
- [~] Restrict student access to that student's own profile, attendance, assignments, payments, grades, and report cards. Student list/detail and attendance APIs now force the session student ID; assignments, payments, grades, and report cards still need review.
- [~] Restrict teachers to classes, subjects, and students assigned to them, including when a caller supplies class, subject, teacher, or student IDs. Teacher/class/subject list endpoints now derive scope from the session. Student list/detail derive teacher scope from the session; grade and result APIs filter by assigned lessons/classes; attendance edits validate source and destination lesson scope. Teacher student-profile writes are now denied, and profile UI hides avatar editing from teachers and parents, consistent with the confirmed admin enrollment and teacher attendance/grades responsibilities. Historical class/teacher access rules still need confirmation.
- [~] Restrict staff actions according to the agreed permission matrix; explicitly limit student creation/deletion and staff/account administration. Removed teachers from student create, detail delete, and bulk-delete API access. Broader staff action matrix and account administration routes remain open.
- [ ] Check ownership and authorization on list, detail, bulk, export, and mutation endpoints, not only page navigation.
- [ ] Ensure dashboard middleware and client-side role checks are treated as navigation/UI controls, never as the sole API security boundary.
- [ ] Replace broad Prisma relation includes with explicit `select` lists for each API response.
- [~] Verify no endpoint returns passwords, password hashes, reset tokens, secrets, or unrelated personal records. Removed full parent data from GET `/api/grade` and full student data from its POST refresh response. Grading list now returns metadata/counts only; grading detail uses explicit student fields and scopes teacher records by assigned class/subject (traits by form-master classes). Student-trait GET/POST also enforce form-master ownership. Class detail hides other families' students from parents; teacher parent responses now omit sensitive home/health details and other children outside the teacher's classes; parent-facing teacher detail omits home/health data. A full API response audit is still required.
- [~] Protect the Dropbox token endpoint; keep access and refresh tokens server-side and return only the minimum upload/display result needed by the client. Added a session check so anonymous callers receive 401; local built-runtime check confirmed this. Signed-in users still receive a Dropbox bearer token because current browser upload/display components depend on it, so the server-side proxy replacement and role/operation scoping remain outstanding.
- [~] Review Dropbox callback handling, OAuth state validation, allowed upload types/sizes, and generated shared-link permissions. Disabled `/api/dropbox/callback` with HTTP 410 because it reflected OAuth authorization codes and lacked state validation; removed the unused legacy sample that placed the app secret in a generated command. A complete server-side OAuth flow and upload policy remain outstanding.
- [ ] Add request size limits and sensible pagination/filter limits to endpoints that return lists or accept bulk writes.
- [~] Review CSRF protections for cookie-authenticated mutations and security headers for the deployed app. Middleware now rejects API mutations carrying a malformed or cross-origin `Origin`; API handlers retain their own authentication responses. Added HSTS, `nosniff`, frame denial, referrer, permissions, and cross-domain policy headers. Same-origin authenticated mutation behavior and production proxy/header behavior still need verification.
- [ ] Review personal data collected (including birthday, address, blood group, and family contacts); remove fields that are not needed for a defined school purpose.
- [ ] Define data retention, archival, correction, and deletion rules for student and family records.

### Audit and incident readiness

- [ ] Add an append-only audit log for sensitive actions: actor, role, action, affected record, timestamp, and relevant before/after values. Durable audit storage needs an additive schema migration; production backup/restore and migration procedures are not yet confirmed.
- [ ] Audit grade entry, grade changes, grading publication, student transfers, account/role changes, attendance corrections, and fee adjustments.
- [ ] Do not put passwords, tokens, or unnecessary personal data into logs.
- [ ] Define who reviews audit activity and how suspected misuse or data exposure is reported and handled.
- [ ] Verify database backups are encrypted, scheduled, monitored, and retained according to policy.
- [ ] Perform and document a restore exercise in a non-production environment.
- [ ] Document an incident response process for unauthorized access, accidental disclosure, and data loss.

## Phase 2 - Make the student record reliable

### Student lifecycle

- [ ] Define required fields and validation rules for admission, including uniqueness and acceptable formats.
- [ ] Build a complete admission workflow that creates or links a guardian, assigns a class, and confirms the final student record.
- [ ] Ensure generated admission numbers are safe under concurrent admissions and cannot collide.
- [ ] Add a reviewable process for correcting student identity and guardian details.
- [ ] Add class promotion/transfer workflows that retain a dated history of prior classes and effective dates.
- [ ] Define withdrawal, graduation, and re-enrollment workflows that preserve historical grades and attendance.
- [ ] Keep inactive/withdrawn status separate from deletion; restrict hard deletion to an audited, authorized process.
- [ ] Support multiple guardians per student if school policy requires it; define guardian relationship and access permissions.
- [ ] Validate guardian contact changes and provide a process to record consent or verification where required.
- [ ] Keep enrollment status, current class, and school year/session clear and historically traceable.
- [ ] Define rules for duplicate detection and safe merging of duplicate student or guardian records.

### Data quality and integrity

- [ ] Add database constraints for required uniqueness and valid relationships that are currently enforced only in application code.
- [ ] Review every model for appropriate indexes, uniqueness, nullability, delete behavior, and historical retention.
- [ ] Make multi-step changes transactional (for example, term activation and report generation) where partial completion would leave inconsistent data.
- [ ] Add server-side validation for date ranges, numeric limits, enum values, and relationships between referenced records.
- [ ] Standardize field names and normalize phone numbers, email addresses, dates, and session/term labels.
- [ ] Add pagination and search to large student, parent, teacher, and assessment lists.
- [ ] Provide controlled exports with authorization, audit logging, and only the fields needed for the export.
- [ ] Add a safe data correction process; preserve the audit/history needed to explain important changes.

## Phase 3 - Make academic workflows dependable

### Academic setup

- [ ] Define the academic session/calendar model and how terms belong to a session.
- [ ] Enforce the school's rule for active terms and prevent concurrent updates from creating conflicting active terms.
- [ ] Define class naming, section/level, capacity, and teacher assignment rules.
- [ ] Define subject offering rules by class, section, and academic year.
- [ ] Make the grading policy explicit: pass marks, maximums, weights, rounding, grade bands, and any section-specific behavior.
- [ ] Validate grading policy weights and totals against the school's approved rules.
- [ ] Define which roles can create gradings, enter marks, review marks, approve results, and publish report cards.

### Attendance

- [ ] Build a fast, class/lesson-based attendance screen that works on phones and tablets.
- [ ] Prevent duplicate attendance records for the same student, lesson, and date (or define the appropriate unique key).
- [ ] Define attendance states required by the school (present, absent, late, excused, etc.) and record them consistently.
- [ ] Validate that a student belongs to the class for the selected lesson before saving attendance.
- [ ] Allow authorized correction of attendance with a reason and audit history.
- [ ] Provide student attendance history and class-level summaries for permitted staff and families.
- [ ] Add configurable absence/lateness thresholds and an actionable follow-up list for staff.
- [ ] Record family contact/follow-up outcomes when attendance concerns are addressed.
- [ ] Ensure attendance reports can be filtered by student, class, date range, and session.

### Grade entry, review, and publication

- [ ] Make the grade-entry screen clearly identify session, term, class, subject, policy, and assessment maximums.
- [ ] Ensure only students enrolled in the selected class and period can receive marks.
- [ ] Ensure the teacher is assigned to the selected class/subject before reading or saving marks.
- [ ] Validate score ranges, required assessments, duplicate submissions, and aggregate calculations on the server.
- [ ] Save bulk score changes transactionally and report partial/failed operations clearly.
- [ ] Show saved/draft status and protect users from losing unsaved work.
- [ ] Add a review/approval stage before results are published, if required by school policy.
- [ ] Prevent silent edits after publication; require an authorized correction flow with a reason and audit record.
- [ ] Define and consistently implement grade bands, rounding, remarks, class positions, ties, and missing-score behavior.
- [ ] Test calculations against school-approved sample cases, including empty marks, maximum marks, ties, and prior-term averages.
- [ ] Generate report cards from a consistent, reproducible set of approved grade data.
- [ ] Make publication explicit and visible; students and parents should not see draft/unapproved results.
- [ ] Support report-card print/download layouts and verify that they display the correct school, student, session, term, and marks.
- [ ] Document third-term promotion remark rules and confirm them with school leadership.
- [ ] Retain prior report cards when a student changes class or leaves the school.

### Lessons, assignments, and tests

- [ ] Decide which teaching/learning features are in scope for this product versus a dedicated learning management system.
- [ ] Define the teacher/class/subject ownership rules for lessons, assignments, tests, questions, answers, and submissions.
- [ ] Validate lesson time ranges and prevent conflicts for teachers and, where required, classes and rooms.
- [ ] Define assignment submission states, due-date behavior, late submissions, grading, feedback, and resubmissions.
- [ ] Define test lifecycle states, availability windows, attempt rules, and student eligibility.
- [ ] Protect answer keys and unpublished test content from student-facing responses.
- [ ] Store file references safely and validate upload size, type, ownership, and access permissions.
- [ ] Add history for edits to assignment/test content after students have begun work.

## Phase 4 - Improve family and school communication

- [ ] Define which notices are public, school-wide, class-specific, staff-only, or family-specific.
- [ ] Define who can create, approve, publish, edit, and archive announcements and news.
- [ ] Make event dates and time zones unambiguous and provide calendar/list views.
- [ ] Target notifications using server-verified class, student, parent, or staff relationships.
- [ ] Add delivery/read status and retry behavior where notifications are sent electronically.
- [ ] Avoid duplicate notifications when bulk actions are retried.
- [ ] Provide a parent/student home view of relevant updates, upcoming events, attendance concerns, and published results.
- [ ] Provide clear notification preferences and respect those preferences where policy permits.
- [ ] Record important family communication outcomes when staff need a history of contact.

## Phase 5 - Decide and complete finance workflows

- [ ] Confirm whether fee management is in scope and define the school's authoritative accounting/payment process.
- [ ] Define fee schedules by school year, term, class/level, student category, and approved discounts/waivers.
- [ ] Distinguish invoices/charges, payment attempts, confirmed receipts, refunds, adjustments, and outstanding balances.
- [ ] If integrating a payment provider, verify payment status server-to-server; never trust a browser-only success response.
- [ ] Add receipt numbers, reconciliation, and an audited correction/refund process.
- [ ] Restrict financial records to authorized roles and parents of the associated student, as defined by policy.
- [ ] Provide finance reports with totals, date ranges, statuses, and export controls.
- [ ] If payment processing is not in scope, describe the feature as fee-record tracking and avoid implying that the system accepts payments.

## Phase 6 - Accessibility, mobile, and resilience

- [ ] Identify parent and student representatives to review their dashboards and key family workflows.
- [ ] Confirm supported browsers/devices, expected user counts, school calendar, approved grading rules, and connectivity constraints with the school.
- [ ] Test the primary workflows on common mobile screen sizes and slow connections.
- [ ] Make attendance, grade entry, student search, and parent result viewing usable on phones and tablets.
- [ ] Ensure forms support keyboard navigation, visible focus, labels, accessible validation messages, and screen readers.
- [ ] Check color contrast, text sizing, table accessibility, and non-color-only status indicators.
- [ ] Provide loading, empty, error, retry, and success states for every important data workflow.
- [ ] Prevent duplicate submissions and make network errors recoverable without losing entered work.
- [ ] Evaluate offline or low-connectivity support for critical workflows; define conflict handling before adding offline writes.
- [ ] Add print-friendly views for documents families or staff need on paper.
- [ ] Localize date, time, number, and currency display to the school's operating context.

## Phase 7 - Reporting and operational insight

- [ ] Agree on the decisions each report should support before building it.
- [ ] Provide enrollment, class roster, attendance, grade, and result-publication reports with clear definitions.
- [ ] Add role-appropriate dashboards that summarize actionable items without exposing unrelated student data.
- [ ] Define attendance and academic indicators consistently and document their calculation.
- [ ] Allow authorized staff to compare periods while preserving cohort/class context.
- [ ] Audit and protect exports because they can contain large amounts of personal information.
- [ ] Avoid presenting incomplete or unverified data as a final school-wide statistic.

## Phase 8 - Multi-school readiness (only if required)

- [ ] Decide the tenant model: one database with school IDs, separate schemas, or separate databases.
- [ ] Add a first-class School/Organization record and associate users and school-owned records with it.
- [ ] Enforce tenant scope on every server query, relation, export, background task, and file permission.
- [ ] Define cross-school users and central administrators explicitly if the product needs them.
- [ ] Add tenant-aware uniqueness rules (for example, class names or admission numbers scoped to a school where appropriate).
- [ ] Add tests or review checks that prove one school's users cannot access another school's data.
- [ ] Plan tenant migration and data separation before onboarding a second school.

## Phase 9 - Quality, maintenance, and release discipline

- [ ] Make the production build script work on supported development platforms (the current `NODE_OPTIONS=...` command fails under Windows `cmd`).
- [ ] Before any production schema/data write, confirm current migration state, backup status, a successful restore rehearsal, rollback procedure, and responsible service owner.
- [ ] Add automated tests for authentication, authorization, record ownership, validation, and core calculations.
- [ ] Add integration tests for student admission, attendance, grade entry, publication, and parent/student result access.
- [ ] Add end-to-end tests for the most important user journeys by role.
- [ ] Add database migration checks and test migrations against a representative database snapshot.
- [ ] Add static analysis and type checks to the regular development/release workflow.
- [ ] Add production monitoring for availability, API failures, slow database queries, and external Dropbox failures.
- [ ] Redact personal data and credentials from telemetry and error reports.
- [ ] Document environment variables, deployment steps, migration procedure, backup/restore, and support contacts.
- [ ] Review dependency updates and security advisories on a regular schedule.
- [ ] Maintain an accessible change log for school staff when workflows change.

## Definition of ready for real school use

- [ ] Record access has been reviewed for every API route and verified for every role.
- [ ] No API response includes password hashes, secrets, or unrelated personal data.
- [ ] Backups have been restored successfully in a rehearsal.
- [ ] Student enrollment, class changes, attendance, grading, review, and publication work end to end.
- [ ] School leadership has approved grading, attendance, promotion, and data-retention rules.
- [ ] Staff and family users can complete their critical tasks on supported devices and assistive technology.
- [ ] Reports and exports have clear definitions, permission checks, and appropriate audit records.
- [ ] Support, incident response, and data correction procedures are documented.

## Notes and completed work

| Date | Item / phase | Issue or pull request | Notes |
| --- | --- | --- | --- |
| 2026-10-04 | Phase 0 baseline | Not available in workspace | Read-only inventory found 135 App Router page files, 36 API route files, 30 Prisma models, and 12 migrations. TypeScript check and direct production build passed; local and production requests to `/` and `/auth/signin` returned 200, and unauthenticated `/api/students` returned 401. Production is reported to deploy from GitHub and the public site is served by Vercel. `npm run build` fails on Windows due to shell syntax. No migration, seed, or database command was run. Parent/student workflow representatives and the production migration/backup/restore procedure remain unknown. |
| 2026-10-04 | Phase 1 authentication | Not available in workspace | User confirmed a Production `NEXTAUTH_SECRET` exists; strength and environment separation are awaiting confirmation. Inactive-account sign-in errors were made generic. TypeScript validation and `next build` passed; built local runtime returned `/` 200, `/auth/signin` 200, and unauthenticated `/api/students` 401. The live site still runs the currently deployed version; no push/deployment or credentialed sign-in test was performed. |
| 2026-10-04 | Phase 1 Dropbox containment | Not available in workspace | `/api/dropbox/token` now requires an authenticated session; an anonymous local request returned 401. This is containment only: authenticated browser clients still receive the Dropbox access token, so the token must later be kept server-side by moving these operations behind scoped application endpoints. TypeScript validation and production build passed after the change; local built-runtime checks returned `/` 200, `/auth/signin` 200, `/api/students` 401, and `/api/dropbox/token` 401. No production deployment was made. |
| 2026-10-04 | Phase 1 grade response data minimization | Not available in workspace | GET `/api/grade` no longer includes parent account data; its POST response no longer returns full student records. TypeScript validation and production build passed. Teacher class/subject/student authorization and wider endpoint response auditing remain open. |
| 2026-10-04 | Phase 1 student API access | Not available in workspace | Student list and detail APIs now scope parent requests to the session parent, student requests to the session student, and teacher requests to assigned classes; submitted parent/teacher IDs cannot widen list access. Teacher access to student creation and deletion was removed. Teacher/student edits are scoped and cannot change placement, status, or password. TypeScript validation and production build passed; local built-runtime checks returned `/` and `/auth/signin` 200 and unauthenticated student list/detail APIs 401. Authenticated per-role database-backed tests were not possible without test accounts/data access. |
| 2026-10-04 | Phase 1 grade authorization | Not available in workspace | Grade reads and writes for teachers are now limited to class/subject pairs in their assigned lessons. Writes also require each requested student to be in that class. TypeScript and full production build passed. This current-membership check may affect teachers editing historical grades after class/teacher assignments change; rules for historical access need school confirmation and must be tested with representative data. |
| 2026-10-04 | Phase 1 results and attendance scope | Not available in workspace | Parent result reads now always intersect query filters with that parent's children; teacher result reads always intersect with assigned/form-master classes even if `classId` is supplied. Student attendance reads are limited to self. Attendance updates check the original record and proposed student/lesson class pairing, and teacher changes require both lessons to be in their scope. TypeScript and full production build passed; local built-runtime checks returned `/` and `/auth/signin` 200, and unauthenticated students, Dropbox-token, attendance, and results APIs 401. Authenticated role-based tests remain outstanding. |
| 2026-10-04 | Phase 1 password policy and onboarding | Not available in workspace | New/changed password validation is 12 characters minimum. Admin-created student, parent, and teacher accounts now require an administrator-entered password instead of the shared `password` default; existing sign-in accepts shorter legacy passwords. TypeScript validation and full production build passed. Forced password change at first sign-in is not implemented; no schema migration was run. |
| 2026-10-25 | Phase 1 grading and trait responses | Not available in workspace | `/api/gradings` now returns grading period metadata and counts only, avoiding nested student records. `/api/gradings/[id]` uses explicit safe student fields and limits teacher marks to assigned class/subject pairs and traits to form-master classes. `/api/traits` now checks the signed-in teacher’s form-master ownership for both reads and writes. TypeScript and full production build passed; local built-runtime checks returned `/` and `/auth/signin` 200 and unauthenticated grading list/detail, trait, and Dropbox-token routes 401. Authenticated role-based database tests are still needed. |
| 2026-10-25 | Phase 1 teacher/class/subject list scope | Not available in workspace | Teacher list responses are limited to the signed-in teacher, parent, or student's linked classes and no longer include notification rows. Class and subject lists derive parent/student/teacher filters from the session; client-supplied IDs cannot widen scope. TypeScript and full production build passed; local built-runtime checks returned `/` and `/auth/signin` 200 and unauthenticated teacher, class, subject, grading, and trait APIs 401. Authenticated role-based database tests remain outstanding. |
| 2026-10-25 | Phase 1 session invalidation | Not available in workspace | Session lifetime is 8 hours. NextAuth now rechecks account active status and role and compares a password-hash fingerprint on session load; token versioning invalidates all sessions issued before this feature, requiring one sign-in after deployment. This avoids a schema change. TypeScript and full production build passed; local smoke returned `/`, `/auth/signin`, and `/api/auth/session` 200 and unauthenticated student/teacher/grading APIs 401. Credentialed account-change verification requires database-backed test accounts. |
| 2026-10-25 | Phase 1 class roster privacy | Not available in workspace | Class detail now limits the nested student roster to children linked to the signed-in parent, avoiding disclosure of classmates' names, admission numbers, and gender. TypeScript and full production build passed; local built-runtime smoke returned `/`, `/auth/signin`, and `/api/auth/session` 200; `/api/stats?role=super`, `/api/students`, and `/api/classes` returned 401 anonymously. Parent-vs-classmate behavior requires an authenticated database-backed test. Production remains on the deployed version until a release is approved and deployed. |
| 2026-10-25 | Phase 1 password change role binding | Not available in workspace | Self-service password changes now require the submitted account type to match the authenticated session role, closing an ID/role mismatch in the password endpoint. TypeScript and full production build passed; local built-runtime smoke returned `/`, `/auth/signin`, and `/api/auth/session` 200, protected APIs 401 anonymously, and GET `/api/auth/change-password` 405 as expected for the POST-only route. Credentialed password-change tests and production verification remain outstanding. |
| 2026-10-25 | Phase 1 Dropbox callback containment | Not available in workspace | Disabled `/api/dropbox/callback` with HTTP 410 because it echoed OAuth authorization codes without state validation; removed an unused legacy handler that generated a command containing the app secret. TypeScript and full production build passed; local runtime confirmed a generic 410 with `no-store` and `no-referrer` headers and no reflected code. The browser-facing token endpoint still returns access tokens to signed-in clients and requires a server-side upload/display migration. Production verification remains pending. |
| 2026-10-25 | Phase 1 API origin and response headers | Not available in workspace | Added HSTS and browser security headers; middleware rejects malformed or cross-origin `Origin` headers for API mutations while leaving API authentication to route handlers. TypeScript and full build passed. Local runtime confirmed expected headers, public pages 200, session API 200, anonymous student and Dropbox-token APIs 401, cross-origin student POST 403, and same-origin unauthenticated POST 401. Production proxy/header behavior and authenticated mutations still require deployment testing. |
| 2026-10-25 | Phase 1 profile scope audit | Not available in workspace | Teachers can no longer write student profile records; student self-edits remain restricted from placement/status/password changes. Profile UI hides avatar editing from teachers and parents. Teacher parent detail responses now omit sensitive parent home/health fields and restrict nested children to classes connected to that teacher. Parent-facing teacher detail no longer returns home/health data. TypeScript and full build passed; authenticated record-level tests against representative data remain outstanding. |
| 2026-10-25 | Phase 1 draft permission target | Not available in workspace | Documented intended resource owners for enrollment, fees, attendance, grades, student records, and system configuration from the school-confirmed workflow. Matrix remains a draft because no school-office app role exists and proprietor/management account mapping and publication authority need confirmation. |
| 2026-11-02 | Phase 1 shared rate-limit implementation | Not available in workspace | Added Upstash Redis/Rate Limit SDKs and shared throttles for credentials sign-in (20 per source IP and 10 per normalized account per 10 minutes) and password change (5 per account per 10 minutes). Identifiers are hashed before becoming Redis keys. Production fails closed when Upstash credentials are missing or unavailable; local development bypasses throttling until a dev store is configured. Documented the Vercel integration setup in `SECURITY_OPERATIONS.md`. Provider provisioning, Vercel variable binding, and authenticated threshold tests remain pending. |
| 2026-11-06 | Phase 1 Vercel Redis variable compatibility | Not available in workspace | User reports the linked project exposes `KV_REST_API_URL`, `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL`, and `REDIS_URL`. Updated the app to accept Vercel's `KV_REST_API_URL` with the required write-enabled `KV_REST_API_TOKEN`; the read-only token and TCP connection URLs are insufficient for the REST-based limiter. TypeScript and production build pass. The write token is not yet confirmed/configured, so no live limiter request has been made and production sign-in must not be deployed until it exists. |
|  |  |  |  |
