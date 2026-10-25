# LocalHelp

LocalHelp is a React/Vite frontend with a Node.js/Express API and MongoDB Atlas.

## Requirements

- Node.js and npm
- A MongoDB Atlas connection string

## Configure the backend

1. In `backend`, copy `.env.example` to `.env`.
2. Set `MONGO_URI` to your MongoDB Atlas connection string and `JWT_SECRET` to a long random secret.

## Run locally

Open two terminals from the project folder.

Terminal 1:

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

## Verify

- API health: open `http://localhost:5000/` and check for `LocalHelp API is running`.
- Frontend checks: from `frontend`, run `npm run lint` and `npm run build`.

The frontend uses `http://localhost:5000/api` by default. To change it, set `VITE_API_URL` in a frontend `.env` file.
