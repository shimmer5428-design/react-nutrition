# React Nutrition App

A React + FastAPI + Supabase nutrition planning application.

## Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Runs on http://localhost:8000. API docs at http://localhost:8000/docs.

## Frontend (React + Vite + TypeScript)

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173.

## Supabase Tables

- `persons` - name (PK), data (JSONB)
- `custom_foods` - name (PK), data (JSONB)
- `week_plans` - week_id, person_name, day_of_week (composite PK), data (JSONB)

## Environment Variables

Backend `.env`:
- `SUPABASE_URL`
- `SUPABASE_KEY`

Frontend `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
