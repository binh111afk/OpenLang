# Deploy OpenLang Full Stack On Vercel

Deploy project nay o **repo root**, khong deploy rieng thu muc `client`.

## 1. Root Directory

Trong Vercel project:

- `Root Directory`: `.`
- Framework preset: de Vercel tu nhan hoac chon `Other`

Repo da duoc cau hinh san trong [vercel.json](/c:/Users/Lenovo/Desktop/OpenLang/vercel.json):

- build frontend tu `client`
- publish static files tu `dist`
- expose serverless APIs tu thu muc `api`

## 2. Environment Variables

Them cac bien moi truong nay trong Vercel Project Settings:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_URL=your_supabase_postgres_connection_string
PIXABAY_API_KEY=your_pixabay_api_key
```

Neu frontend va API cung nam trong cung mot Vercel project thi:

- khong can `VITE_API_BASE_URL`
- client se goi cung domain qua `/api/*`

Chi dat `VITE_API_BASE_URL` khi frontend va backend nam tren hai domain khac nhau.

## 3. Required Database Tables

Can co cac bang:

- `public.vocabulary`
- `public.flashcard_decks`
- `public.flashcards`
- `public.user_progress`
- `public.daily_stats`
- `public.weekly_leaderboard`

Schema cho `flashcard_decks` va `flashcards` nam tai:

- [flashcards-library-schema.sql](/c:/Users/Lenovo/Desktop/OpenLang/server/scripts/flashcards-library-schema.sql)

Schema hoc tap (SRS, XP, leaderboard) nam tai:

- [openlang-learning-schema.sql](/c:/Users/Lenovo/Desktop/OpenLang/server/scripts/openlang-learning-schema.sql)

Build script tren Vercel se tu dong chay migration SQL truoc khi build frontend:

- [run-db-migrations.cjs](/c:/Users/Lenovo/Desktop/OpenLang/scripts/run-db-migrations.cjs)

## 4. Redeploy

Sau khi cap nhat env:

1. Redeploy project
2. Mo domain Vercel
3. Thu tao bo the moi trong `Library`
4. Thu API SRS: `/api/srs-review`

## 5. Quick Checks

Sau deploy, cac URL nay phai tra JSON:

- `/api`
- `/api/library`
- `/api/flashcards`

Neu `/api/library` tra HTML thay vi JSON thi ban dang deploy sai root hoac frontend dang tro toi sai domain API.
