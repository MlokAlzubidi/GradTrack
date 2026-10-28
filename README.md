# GradTrack — Graduation Project Management System

GradTrack is a React + Vite frontend prototype for managing university graduation projects. It includes student and team-leader workflows, supervisor review screens, task tracking, proposal submission, and local demo notifications.

## Requirements

- Node.js compatible with the Vite version in `package.json`
- npm

## Run locally

```bash
npm ci
npm run dev
```

## Build the frontend

```bash
npm run build
npm run preview
```

## Demo accounts

Student demo accounts:

| University ID | Password | Demo state |
| --- | --- | --- |
| `2023001` | `123456` | No team |
| `2023002` | `123456` | Member of the GradTrack Demo Team |
| `2023003` | `123456` | Team Leader of the GradTrack Demo Team |

Supervisor demo account:

- Email: `supervisor@gradtrack.demo`
- Password: `Supervisor123!`

These credentials are for local demonstration only. Do not use them as real credentials.

## Current prototype behavior

- Student registration and sessions are simulated in browser storage.
- Team, task, proposal, notification, and review records are stored in `localStorage` / `sessionStorage`.
- Small demo file uploads are stored in browser storage as data URLs.
- Task-level supervisor review is opt-in: the Team Leader selects **Requires supervisor review** for a task. Only those task submissions appear in the supervisor submissions inbox.
- Proposal submission and review updates create demo notifications for the supervisor or current team members.
- Data is local to the browser and does not synchronize across devices or users. This project does not yet have a real backend, database, secure authentication, or server-side file storage.
- Frontend route checks are convenience guards for the prototype; they are not a substitute for server-side authorization.

## Project structure

- `src/pages/auth` — role selection, student registration/login, supervisor login
- `src/pages/student` — dashboard, teams, invitations, tasks, project registration, and proposal status
- `src/pages/supervisor` — supervisor dashboard, project/proposal review, task submissions, notifications, and profile
- `src/components/layout` — shared navigation layouts
- `src/data` — sample account data and demo-data initialization
- `src/utils` — demo notifications and supervisor session utilities

## Before production use

Connect the frontend to a backend API, store passwords securely on the server, enforce role/team authorization server-side, and use proper file storage instead of browser local storage. Also test the complete student/team/supervisor workflows before deploying the public demo.
