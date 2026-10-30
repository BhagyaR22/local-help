# LocalHelp

LocalHelp is a React/Vite frontend with a Node.js/Express API and MongoDB Atlas.

## Requirements

- Node.js and npm
- A MongoDB Atlas connection string

## MongoDB databases

LocalHelp uses two separate MongoDB Atlas databases. They can be on the same Atlas cluster, but their database names must stay different:

- **Main database: `localhelp`** — used by `MONGO_URI` when you run `npm start`.
- **Test database: `localhelp_test`** — used by `TEST_MONGO_URI` when you run `npm run start:test` or `npm run seed:test`.

Use the same Atlas username, password, and cluster host in both connection strings, but change the database name after the host:

```ini
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/localhelp?retryWrites=true&w=majority
TEST_MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/localhelp_test?retryWrites=true&w=majority
```

Replace the placeholders with your Atlas details. URL-encode special characters in the password. Never commit your real `.env` file.

## Configure the backend

1. In `backend`, copy `.env.example` to `.env`.
2. Set `MONGO_URI` to the `localhelp` connection string, `TEST_MONGO_URI` to the separate `localhelp_test` connection string, and `JWT_SECRET` to a long random secret.

## Run locally

Open two terminals from the project folder.

Terminal 1 (normal database):

```sh
cd backend
npm install
npm start
```

Terminal 2:

```sh
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Generate separate test data

The `TEST_MONGO_URI` value must point to the separate `localhelp_test` database. Keep `MONGO_URI` pointed at the main `localhelp` database. `npm run seed:test` writes only to `TEST_MONGO_URI`; it does not seed the main database.

From the `backend` folder, seed sample data:

```sh
npm run seed:test
```

By default, this creates 20 test users, 200 service listings, 1,000 tasks, and 300 inquiries. You can choose different amounts:

```sh
npm run seed:test -- --users 500 --offers 1000 --tasks 10000 --inquiries 2000
```

The script refuses to run unless the `TEST_MONGO_URI` database name contains `test`. Re-running it replaces records belonging to its own `lh_test_` sample users in that test database. All generated users use the password `LocalHelpTest123!`; their usernames are `lh_test_00001`, `lh_test_00002`, and so on. These are fake test accounts. Do not put real contact details or passwords in generated data. To run the website against this test database, stop the normal backend and run `npm run start:test` from `backend`. This only switches the running backend to `TEST_MONGO_URI`; the regular `npm start` continues using `MONGO_URI`.

## Verify

- API health: open `http://localhost:5000/` and check for `LocalHelp API is running`.
- Frontend checks: from `frontend`, run `npm run lint` and `npm run build`.

The frontend uses `http://localhost:5000/api` by default. To change it, set `VITE_API_URL` in a frontend `.env` file.
