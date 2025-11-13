Polling OAuth Fullstack (Google OAuth handled by backend)
=======================================================

Quick start (local MongoDB)
---------------------------
1. Create Google OAuth credentials:
   - Go to Google Cloud Console -> APIs & Services -> Credentials
   - Create OAuth Client ID (web application)
   - Authorized redirect URI: http://localhost:5000/auth/google/callback
   - Copy Client ID and Client Secret and paste into backend/.env

2. Start MongoDB locally (default mongodb://localhost:27017).

3. Backend:
   cd backend
   npm install
   # edit .env and add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and JWT_SECRET
   npm start

4. Frontend:
   cd frontend
   npm install
   npm run dev
   # open the Vite URL (usually http://localhost:5173)

Notes:
 - After Google Login you'll be redirected to frontend with token in query param; the frontend saves it to localStorage.
 - Protected routes require the token in Authorization header (handled by frontend api.js)
