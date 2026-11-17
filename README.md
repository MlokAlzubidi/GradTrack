# GradTrack — Graduation Project Management System

GradTrack is a graduation project management system with a React and Vite frontend and a Node.js and Express backend. The backend provides MongoDB-backed account registration, login, session validation, and profile operations. Several project-management screens are implemented in the frontend but still use browser storage and demo data rather than backend APIs.

## Features

### Backend functionality

- Student account registration and login using an 11-digit University ID.
- Supervisor account registration with a pre-approved 5-digit Staff ID, and login using that Staff ID.
- Password hashing with `bcryptjs` and JWT-based authentication.
- Logout and token-version invalidation, including invalidation of existing sessions after a password change.
- Protected current-user profile retrieval and updates, and password changes.
- Zod request validation, authentication and role-authorization middleware, rate limits for login, registration, and password changes, and centralized Express error handling. Current API routes use authentication protection and expose account and own-profile operations.
- MongoDB access through Mongoose.

### Frontend functionality and data storage

The frontend includes student and supervisor screens for teams, invitations, tasks, project registration, proposals, assignments, submissions, and notifications. These project-management workflows currently read and write mock data in `localStorage` and/or `sessionStorage`; they are not connected to backend endpoints. The backend currently exposes account and current-user profile APIs only. The frontend's login, registration, logout, session verification, and profile operations use those backend APIs.

## Technology Stack

- React 19 and React Router
- Vite
- Node.js and Express
- MongoDB with Mongoose
- JWT (`jsonwebtoken`)
- `bcryptjs`
- Zod
- Axios

## Authentication and User Roles

The backend supports two roles: `student` and `supervisor`. Login requests include an `identifier`, `password`, and `role`. Students use their University ID; supervisors use their Staff ID. Protected requests use an `Authorization: Bearer <token>` header.

Supervisor registration succeeds only when the submitted Staff ID has an unused pre-approved record in the `ApprovedSupervisor` collection. The repository does not configure an npm seed command in `backend/package.json`; the availability of approved IDs therefore depends on the database setup used by the deployment.

## ID and Password Validation

- Student University IDs must contain exactly 11 digits.
- Supervisor Staff IDs must contain exactly 5 digits.
- Registration passwords must be at least 8 characters and no more than 72 UTF-8 bytes; passwords cannot consist only of spaces.
- Email is optional at registration and profile update; if provided and non-empty, it must be valid.

## Project Structure

```text
.
├── public/                 # Static frontend assets
├── src/
│   ├── components/         # Shared layouts, guards, and UI components
│   ├── context/            # Frontend authentication context
│   ├── data/               # Mock/demo browser data
│   ├── pages/
│   │   ├── auth/
│   │   ├── student/
│   │   └── supervisor/
│   ├── routes/             # Frontend route configuration
│   ├── services/           # Backend API client
│   ├── styles/
│   └── utils/              # Browser-storage helpers and frontend utilities
├── backend/
│   ├── src/
│   │   ├── config/         # MongoDB connection
│   │   ├── controllers/    # Authentication and profile handlers
│   │   ├── data/           # Approved-supervisor data
│   │   ├── middleware/     # Authentication, validation, and rate limits
│   │   ├── models/         # User and approved-supervisor models
│   │   ├── routes/         # Express API routes
│   │   ├── scripts/        # Backend scripts and diagnostics
│   │   ├── tests/          # Canonical backend tests and test setup
│   │   ├── utils/          # JWT helper
│   │   ├── validators/     # Zod schemas
│   │   └── server.js
│   ├── .env.example        # Backend environment variable names/examples
│   └── package.json
├── package.json            # Frontend scripts and dependencies
└── README.md
```

## Prerequisites

- Node.js and npm. Use a Node.js version supported by the installed Vite release.
- A MongoDB database for the backend. `backend/.env.example` shows the expected MongoDB Atlas URI format.

## Environment Configuration

Create `backend/.env` from `backend/.env.example` and configure these backend variables:

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend HTTP port; defaults to `5000` in the server. |
| `MONGO_URI` | MongoDB connection URI used by the running backend. |
| `JWT_SECRET` | Secret used to sign and verify JWTs. |
| `JWT_EXPIRES_IN` | JWT lifetime; the backend defaults to `1d` when unset. |
| `FRONTEND_URL` | Allowed frontend origin for CORS; defaults to `http://localhost:5173`. |

For backend tests, also set `TEST_MONGO_URI` in `backend/.env` to a separate database whose name is exactly `gradtrack_test`. This test-only variable is read by the test setup and is not listed in `backend/.env.example`.

The frontend API client defaults to `http://localhost:5000/api`. Set `VITE_API_URL` in the frontend environment only when the backend API uses a different base URL.

Do not commit or share `.env` files. Keep real database URIs and JWT secrets private; only share the example file with placeholder values.

## Installation and Setup

Install frontend dependencies from the repository root:

```bash
npm install
```

Install backend dependencies in a separate terminal:

```bash
cd backend
npm install
```

Before starting the backend, create `backend/.env` from `backend/.env.example` and fill in the required values. Configure `TEST_MONGO_URI` there before running tests.

## Running Frontend and Backend

Start the frontend from the repository root:

```bash
npm run dev
```

Start the backend from the `backend/` directory in a second terminal:

```bash
npm run dev
```

The Vite development server normally uses `http://localhost:5173`; the backend defaults to port `5000`. The backend connects to `MONGO_URI` before listening for requests.

## Backend API Endpoints

| Method | Path | Description | Authentication |
| --- | --- | --- | --- |
| `GET` | `/` | Backend health response. | None |
| `POST` | `/api/auth/register` | Register a student or an approved supervisor. | None |
| `POST` | `/api/auth/login` | Authenticate a student or supervisor and return a JWT. | None |
| `POST` | `/api/auth/logout` | Increment the user's token version to invalidate existing JWT sessions. | Bearer token |
| `GET` | `/api/users/me` | Retrieve the authenticated user's profile. | Bearer token |
| `PATCH` | `/api/users/me` | Update the authenticated user's name and/or email. | Bearer token |
| `PATCH` | `/api/users/me/password` | Change the authenticated user's password and invalidate old tokens. | Bearer token |

There are no backend API routes for team management, tasks, project registration, proposals, assignments, submissions, notifications, or file uploads at this time.

## Running Tests

Run the canonical backend suite from `backend/`:

```bash
npm test
```

The script runs only `src/tests/*.test.js`, sequentially. Tests require `TEST_MONGO_URI` and refuse to clear data unless the connected database is exactly `gradtrack_test`. Use a separate test database; do not point this variable at the production `gradtrack` database.

## Security Notes

- Keep `.env` files and all secrets out of version control and out of shared documentation.
- Configure `MONGO_URI` for the intended application database and `TEST_MONGO_URI` for a separate `gradtrack_test` database.
- Frontend route guards and browser storage support the UI, but do not replace backend authorization. Only the backend routes listed above currently provide server-side account or profile operations.
- The backend accepts JSON request bodies up to 10 KB and applies rate limits to login, registration, and password-change requests.

## Current Implementation Status

Backend authentication and user-profile functionality is implemented and covered by the backend test suite. The frontend calls those APIs for account registration, login, logout, session verification, and profile operations. Team and project workflows are frontend demonstrations backed by mock data and browser storage; they do not synchronize through the backend or across users and devices. Backend persistence and APIs for those workflows, along with server-side file storage, are not implemented in the current source.
