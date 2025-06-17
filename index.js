import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/soop-proxy', async (req, res) => {
  const { bid, bno } = req.body;

  try {
    const url = `https://live.sooplive.co.kr/afreeca/player_live_api.php?bjid=${bid}`;
    const form = new URLSearchParams({
      bid,
      bno,
      type: 'live',
      confirm_adult: 'false',
      player_type: 'html5',
      mode: 'landing',
      from_api: '0',
      pwd: '',
      stream_type: 'common',
      quality: 'HD'
    });

    const response = await axios.post(url, form, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 5000
    });

    res.json(response.data);
  } catch (error) {
    console.error('❌ SOOP API 요청 실패:', error.message);
    res.status(500).json({ error: 'SOOP API 요청 실패' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ SOOP Proxy listening on ${PORT}`));
