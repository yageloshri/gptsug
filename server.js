// server.js
// Node.js Express server for song suggestions with YouTube links using OpenAI GPT

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

app.post('/song-suggestions', async (req, res) => {
  const { genre, era, popularity } = req.body;

  const prompt = `
אתה עוזר מוזיקלי. המשתמש בחר:
- סגנון: ${genre}
- תקופה: ${era}
- פופולריות: ${popularity}

הצע 3 שירים אמיתיים בלבד (שם שיר, מבצע), ולכל שיר תן:
- רעיון יצירתי לסושיאל
- קישור ל-YouTube (הקליפ הרשמי או הביצוע הפופולרי ביותר)

החזר בפורמט JSON בלבד, לדוגמה:
[
  {
    "title": "Someone Like You",
    "artist": "Adele",
    "socialIdea": "קאבר אינטימי עם פוקוס על פנים בשחור-לבן",
    "youtubeUrl": "https://www.youtube.com/watch?v=hLQl3WQQoQ0"
  },
  {
    "title": "Shape of You",
    "artist": "Ed Sheeran",
    "socialIdea": "אתגר ריקוד עם חברים",
    "youtubeUrl": "https://www.youtube.com/watch?v=JGwWNGJdvx8"
  },
  {
    "title": "שמש",
    "artist": "עומר אדם",
    "socialIdea": "צלם את עצמך שר את השיר בזמן השקיעה",
    "youtubeUrl": "https://www.youtube.com/watch?v=XXXXXXXXXXX"
  }
]

הקפד לבחור שירים אמיתיים בלבד, שפורסמו על ידי אמנים מוכרים, והבא קישור ל-YouTube.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 500,
    });

    const text = completion.choices[0].message.content;
    let suggestions = [];
    try {
      suggestions = JSON.parse(text);
    } catch (e) {
      return res.json({ error: 'Could not parse GPT response', raw: text });
    }

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
