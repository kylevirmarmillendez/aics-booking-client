# AICS Booking Client

Next.js App Router client for the AICS user directory. Login, registration, and user CRUD run in this React application and use Passport session authentication from the Express API; MongoDB is the source of truth.

## Run with the API

1. Start the API and MongoDB from `../aics-booking-api` using Docker Compose. Copy that directory's `.env.example` to `.env`, update the local credentials, and run `docker compose up --build -d`.
2. Set `BACKEND_API_URL=http://127.0.0.1:8001` in `.env.local` for local development.
3. Install and start the hot-reload client with `npm install` and `npm run dev -- --hostname 0.0.0.0 --port 3001`.

The Next.js server proxies `/backend-api/*` to `${BACKEND_API_URL}/api/*`, so browser requests are same-origin. Restart Next.js after changing `.env.local`. User records created before this connection in browser local storage are not imported into MongoDB.

Open `/login` to sign in or `/register` to create an account. Successful login and registration redirect to the protected user directory. The API uses an HTTP-only session cookie and CSRF tokens; logout destroys the server-side session. For local Docker, set a private `SESSION_SECRET` in the API `.env` before sharing the environment. Registered accounts receive the standard user role.

The public appointment booking experience is now provided by the separate `aics-booking` Next.js app, not this staff client. From `../aics-booking-api`, it is available at `http://localhost:3003`; the standalone app Compose setup defaults to `http://localhost:3004`. Public booking, availability, lookup, and cancellation use the API; configure optional Google Calendar and SMTP settings in the API `.env` for event and email notifications.

## Run the Dockerized app

From `../aics-booking-api`, run `docker compose up --build -d`. The production client is at `http://localhost:3000`; the Express API is published at `http://localhost:8011` (port 8000 inside Docker). For this client's standalone Compose setup, its default API proxy is `http://host.docker.internal:8011`; change `BACKEND_API_URL` in `.env` if the API is published elsewhere. Stop the stack with `docker compose down`.

## Run only the client with Compose

With the Express API running on host port 8011, run this from the client directory:

```sh
docker compose up --build -d
```

The standalone client is at `http://localhost:3001` by default. It runs a production build; use the local Next.js dev server above for hot reload, and do not run both on port 3001 at the same time. Copy `.env.example` to `.env` to override `BACKEND_API_URL` or `CLIENT_PORT`. Stop it with `docker compose down` from this directory.
