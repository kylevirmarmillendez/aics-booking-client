# AICS Booking Client

Next.js App Router client for the AICS user directory. Login, registration, and user CRUD run in this React application and use Passport session authentication from the Express API; MongoDB is the source of truth.

## Run with the API

1. Start the API and MongoDB from `../aics-booking-api` using Docker Compose. Copy that directory's `.env.example` to `.env`, update the local credentials, and run `docker compose up --build`.
2. In this directory, copy `.env.example` to `.env.local` if the API is not at `http://127.0.0.1:5000`. Set `BACKEND_API_URL` to the backend origin (for example `http://127.0.0.1:5000`).
3. Install and start this client with `npm install` and `npm run dev`.

The Next.js server proxies `/backend-api/*` to `${BACKEND_API_URL}/api/*`, so browser requests are same-origin. Restart Next.js after changing `.env.local`. User records created before this connection in browser local storage are not imported into MongoDB.

Open `/login` to sign in or `/register` to create an account. Successful login and registration redirect to the protected user directory. The API uses an HTTP-only session cookie and CSRF tokens; logout destroys the server-side session. For local Docker, set a private `SESSION_SECRET` in the API `.env` before sharing the environment. Registered accounts receive the standard user role.

## Run the Dockerized app

From `../aics-booking-api`, run `docker compose up --build -d`. Open the client at `http://localhost:3000`; the Express API is at `http://localhost:8000`. Stop the stack with `docker compose down`.

## Run only the client with Compose

With the Express API running on host port 8000, run this from the client directory:

```sh
docker compose up --build -d
```

The standalone client is at `http://localhost:3002` by default, since the full-stack Compose app uses host port 3000. Copy `.env.example` to `.env` to override `BACKEND_API_URL` or `CLIENT_PORT`. To bind the standalone client to `http://localhost:3000`, stop the full-stack client first or set `CLIENT_PORT=3000` when starting this Compose project. Stop it with `docker compose down` from this directory.
