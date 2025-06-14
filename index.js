const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

app.get('/soop-chat', async (req, res) => {
  const bjid = req.query.bjid;
  if (!bjid) return res.status(400).json({ error: 'bjid 파라미터가 필요합니다.' });

  try {
    const infoRes = await axios.post(
      `https://live.sooplive.co.kr/afreeca/player_live_api.php?bjid=${bjid}`,
      `bid=${bjid}&bno=null&type=live&pwd=&player_type=html5&stream_type=common&quality=HD&mode=landing&from_api=0&is_revive=false`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const bno = infoRes.data?.CHANNEL?.BNO;
    if (!bno) return res.status(404).json({ error: '방송이 꺼져 있거나 BNO를 찾을 수 없습니다.' });

    const chatRes = await axios.get('https://live.sooplive.co.kr/api/chat/getChatList', {
      params: {
        bno,
        last_chat_id: 0,
        limit: 50,
      },
    });

    const chats = chatRes.data?.data || [];
    const filtered = chats.filter(chat =>
      chat.msg?.includes('별풍선') || chat.item_name?.includes('별풍선') || chat.msg_type === 'item'
    );

    res.json(filtered);
  } catch (err) {
    console.error('프록시 에러:', err.message);
    res.status(500).json({ error: '프록시 서버 오류 발생' });
  }
});

app.listen(PORT, () => {
  console.log(`SOOP 프록시 서버 실행 중: http://localhost:${PORT}`);
});
