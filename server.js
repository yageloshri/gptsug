import OpenAI from "openai";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

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

הצע 3 שירים מתאימים (שם שיר, מבצע), ולכל שיר תן רעיון יצירתי לסושיאל. החזר בפורמט JSON:
[
  {
    "title": "שם השיר",
    "artist": "שם המבצע",
    "socialIdea": "רעיון לסושיאל"
  },
  ...
]
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 400,
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
