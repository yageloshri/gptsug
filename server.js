// server.js – שרת Node שמקבל ז'אנר/תקופה/פופולריות, משלים עם GPT ואז מחפש שירים אמיתיים ב-Spotify
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

  const prompt = `אתה עוזר מוזיקלי. המשתמש בחר:
- סגנון: ${genre}
- תקופה: ${era}
- פופולריות: ${popularity}

תאר בקצרה איזה סוג שיר יתאים לאמן לשיר עכשיו. רק תיאור.`;

  try {
    const gptRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100
    });

    const description = gptRes.choices[0].message.content;

    // ודא שיש access token
    if (!spotifyAccessToken) await getSpotifyAccessToken();

    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(description)}&type=track&limit=3`, {
      headers: {
        Authorization: `Bearer ${spotifyAccessToken}`
      }
    });
    const data = await searchRes.json();

    const tracks = data.tracks?.items?.map(track => ({
      title: track.name,
      artist: track.artists[0].name,
      image: track.album.images[0]?.url,
      url: track.external_urls.spotify
    })) || [];

    res.json(tracks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
