import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST requests are allowed');
  }

  const { bid, bno } = req.body;

  if (!bid || !bno) {
    return res.status(400).json({ error: 'Missing bid or bno' });
  }

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

  try {
    const response = await axios.post(
      `https://live.sooplive.co.kr/afreeca/player_live_api.php?bjid=${bid}`,
      form
    );

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}