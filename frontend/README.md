# LocalHelp frontend

The React and Vite application for LocalHelp lives in this folder.

## Run the frontend

Start the backend first from the project root in a separate terminal:

```sh
cd backend
npm install
npm start
```

Then start the frontend:

```sh
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Build and lint

```sh
npm run build
npm run lint
```

For the main `localhelp` database and separate `localhelp_test` setup, follow the project [README](../README.md).