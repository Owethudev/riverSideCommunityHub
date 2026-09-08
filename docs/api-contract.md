# API Contract

## Health

`GET /api/health`

Returns HTTP `200`:

```json
{
  "status": "ok",
  "service": "riverside-community-hub-api",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## Future resource endpoints

Authentication, bookings, members, donations, resources, and programmes will be added after the data model and Supabase integration are approved. Request and response schemas will live in `packages/shared` so the frontend and backend consume one contract.
