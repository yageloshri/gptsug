// server.js – מחזיר 5 שירים אמיתיים עם רעיון לסושיאל בהתאם לבחירת המשתמש
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import OpenAI from 'openai';
import fetch from 'node-fetch';

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

let spotifyAccessToken = '';

async function getSpotifyAccessToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  spotifyAccessToken = data.access_token;
}

app.post('/song-suggestions', async (req, res) => {
  const { genre, era, popularity } = req.body;

  const gptPrompt = `אתה עוזר מוזיקלי. המשתמש בחר:
- סגנון: ${genre}
- תקופה: ${era}
- פופולריות: ${popularity}

הצע בדיוק 5 שירים אמיתיים בלבד (שם שיר + שם אמן), שפורסמו באמת, שמתאימים לקריטריונים.
החזר בפורמט JSON בלבד:
[
  { "title": "שם השיר", "artist": "שם האמן" },
  ...
]`;

  const ideaPrompt = `תן רעיון יצירתי לסרטון סושיאל שזמר יכול להעלות אם הוא מבצע שיר בסגנון ${genre}, מהתקופה של ${era}, עם וייב ${popularity}. החזר משפט קצר בלבד.`;

  try {
    // בקשה מ-GPT ל-5 שירים אמיתיים
    const gptRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: gptPrompt }],
      temperature: 0.5,
      max_tokens: 300
    });

    let songs;
    try {
      songs = JSON.parse(gptRes.choices[0].message.content);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid GPT format', raw: gptRes.choices[0].message.content });
    }

    // קבל access token אם צריך
    if (!spotifyAccessToken) await getSpotifyAccessToken();

    // בקשה נוספת לרעיון סושיאל
    const ideaRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: ideaPrompt }],
      temperature: 0.7,
      max_tokens: 60
    });
    const idea = ideaRes.choices[0].message.content.trim();

    // חיפוש ספציפי עבור כל שיר ואמן
    const results = [];
    for (const { title, artist } of songs) {
      const query = `${title} ${artist}`;
      const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
        headers: {
          Authorization: `Bearer ${spotifyAccessToken}`
        }
      });
      const data = await searchRes.json();
      const track = data.tracks?.items?.[0];
      results.push({
        title,
        artist,
        socialIdea: idea,
        spotifyUrl: track?.external_urls?.spotify || ""
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
