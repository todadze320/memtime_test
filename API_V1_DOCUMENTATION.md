# Memtime Interview API v1

Base URL: `https://interview-api.memtime-demo.deno.net/api/v1`

## Authentication

All requests require:

```
Authorization: Bearer <API_KEY>
```

## Rate limiting

15 requests per 60 seconds per API key.

## Pagination

List endpoints accept optional query parameters:

| Parameter | Description        |
| --------- | ------------------ |
| `limit`   | Max items to return |
| `offset`  | Number of items to skip |

## Endpoints

### Clients

- `GET /clients` — list clients

### Projects

- `GET /clients/:id/projects` — projects for a client

### Tasks

- `GET /projects/:id/tasks` — tasks for a project

### Time entries

- `GET /time-entries` — current user's time entries
- `POST /time-entries` — create entry  
  Body (JSON): `taskId`, `comment`, `start`, `end` (ISO 8601)
- `PUT /time-entries/:id` — update entry  
  Body (JSON): same fields as create

## Errors

JSON error responses include an `error` string, for example:

- `400` — `{ "error": "Invalid request body" }`
- `404` — `{ "error": "Time entry not found" }`
