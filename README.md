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

Searchable menus for people, foods, and food categories support case-insensitive
substring matching on labels and stored values. Use Up/Down and Enter to select,
or Escape/Tab to discard unconfirmed input. Only listed options update form values.

Run the frontend interaction tests and production build:

```bash
cd frontend
npm test
npm run build
```

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
