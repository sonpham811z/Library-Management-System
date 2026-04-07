# Library Management Web App

This repository contains 2 projects:

- API backend: `API` (Express + Supabase)
- Frontend: `Front_End` (React + Vite)

## 1. Requirements

- Node.js 18+
- npm 9+
- A Supabase project

## 2. Environment setup

### Backend (`API`)

1. Copy env template:

```bash
cd API
cp .env.example .env
```

On Windows PowerShell:

```powershell
cd API
Copy-Item .env.example .env
```

2. Fill values in `.env`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CLOUDINARY_CLOUD_NAME` (if using avatar upload)
- `CLOUDINARY_API_KEY` (if using avatar upload)
- `CLOUDINARY_API_SECRET` (if using avatar upload)

### Frontend (`Front_End`)

1. Copy env template:

```bash
cd Front_End
cp .env.example .env
```

On Windows PowerShell:

```powershell
cd Front_End
Copy-Item .env.example .env
```

2. Keep or update:

- `VITE_API_URL=http://localhost:5000/api`

## 3. Install dependencies

### Backend

```bash
cd API
npm install
```

### Frontend

```bash
cd Front_End
npm install
```

## 4. Run the app

Open 2 terminals.

### Terminal 1: Backend

```bash
cd API
npm run dev
```

Backend runs at: `http://localhost:5000`

### Terminal 2: Frontend

```bash
cd Front_End
npm run dev
```

Frontend runs at: `http://localhost:5173`

## 5. Database

- Main schema file: `schema.sql`
- Run schema in your Postgres/Supabase SQL editor before using the app.

## 6. Notes

- If login/API calls fail because of CORS, make sure backend `.env` has:

```env
CLIENT_URL=http://localhost:5173
```

- If you changed table structure, make sure backend queries are updated consistently.
