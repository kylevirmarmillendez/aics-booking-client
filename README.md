# AICS Booking Client

Next.js App Router client for the AICS user directory. User list, profile, create, and delete requests are sent to the Express API; MongoDB is the source of truth (not browser local storage).

## Run with the API

1. Start the API and MongoDB from `../aics-booking-api` using Docker Compose. Copy that directory's `.env.example` to `.env`, update the local credentials, and run `docker compose up --build`.
2. In this directory, copy `.env.example` to `.env.local` if the API is not at `http://127.0.0.1:5000`. Set `BACKEND_API_URL` to the backend origin (for example `http://127.0.0.1:5000`).
3. Install and start this client with `npm install` and `npm run dev`.

The Next.js server proxies `/backend-api/*` to `${BACKEND_API_URL}/api/*`, so browser requests are same-origin. Restart Next.js after changing `.env.local`. User records created before this connection in browser local storage are not imported into MongoDB.

The API schema currently has no authentication. Do not expose user-management endpoints publicly until authentication and authorization have been implemented.

## Dockerize the client separately

Start the Express API and MongoDB first from `../aics-booking-api` with its Docker Compose setup. Then, from this client directory, run:

```sh
docker compose up --build -d
```

Open the client at `http://localhost:3003`. The client Compose file routes API requests to the backend published on host port 5000. Set `BACKEND_API_URL` or `CLIENT_PORT` in a local `.env` file to override the defaults. Stop the client container with `docker compose down`.

## Run the full stack with Docker

Alternatively, from `../aics-booking-api`, run `docker compose up --build -d`. This starts the client with the API and MongoDB at `http://localhost:3002`; Mongo Express is at `http://localhost:8082`. Stop that stack from the API directory with `docker compose down`.
