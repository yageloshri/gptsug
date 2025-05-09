# Song Suggestions GPT API

שרת Node.js שמחזיר המלצות שירים מ-GPT לפי בחירת המשתמש.
- POST /song-suggestions
- Body: { genre, era, popularity }
- תשובה: מערך JSON של שירים ורעיונות סושיאל

## הפעלה מקומית
1. npm install
2. העתק .env.example ל-.env והכנס את המפתח שלך
3. npm start

## פריסה ל-Render
- העלה את הקוד ל-GitHub
- צור שירות Web Service חדש ב-Render
- הגדר את OPENAI_KEY במשתני הסביבה
