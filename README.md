# Memtime time tracking UI

React + TypeScript front end for the Memtime interview API: hierarchical clients/projects/tasks, paginated time entries, and create/update forms with validation and error handling.

## Setup

```bash
npm install
cp .env.example .env   # add your API key
npm run dev
```

Environment variables (read by the Vite server only, never bundled into the browser code):

| Variable             | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `MEMTIME_API_KEY`    | Bearer token added to proxied requests as `Authorization`          |
| `MEMTIME_API_ORIGIN` | Optional API origin, defaults to `https://interview-api.memtime-demo.deno.net` |

## How the API key is protected

The browser calls same-origin `/api/v1/...`. The Vite dev and preview servers proxy
those requests to the Memtime API and attach the `Authorization` header, so the key
never appears in the JavaScript bundle or in browser devtools.

`npm run build` produces static files only. In production, serve them behind a
reverse proxy or small backend that does the same thing: forward `/api/*` to the
Memtime API and add the key (or, in a multi-user product, map each user's session
to their own credentials). That backend is also the right place for shared rate
limiting and caching.

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run preview` — preview production build

See [API_V1_DOCUMENTATION.md](./API_V1_DOCUMENTATION.md) for endpoint details.
