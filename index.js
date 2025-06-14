// Render용 Node.js WebSocket → HTTP 중계 프록시 서버
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

let chatBuffer = [];
const MAX_BUFFER = 100;
let ws = null;

// WebSocket 연결 함수
// let state: ConnectState = 'disconnected';
let state = 'disconnected';

async function connectToSoop(bjid) {
  if (state === 'connecting' || state === 'connected') return;
  state = 'connecting';

  try {
    const infoRes = await axios.post(
      `https://live.sooplive.co.kr/afreeca/player_live_api.php?bjid=${bjid}`,
      `bid=${bjid}&bno=null&type=live&pwd=&player_type=html5&stream_type=common&quality=HD&mode=landing&from_api=0&is_revive=false`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const chdomain = infoRes.data?.CHANNEL?.CHDOMAIN;
    const chpt = infoRes.data?.CHANNEL?.CHPT;
    if (!chdomain || !chpt) {
      console.error("채널 정보가 없습니다");
      state = 'disconnected';
      return;
    }

    const wsUrl = `wss://${chdomain}:${chpt}/Websocket/${bjid}`;
    console.log("WebSocket 연결 중:", wsUrl);
    ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log("WebSocket 연결됨");
      state = 'connected';
    });

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        //if (parsed.msg || parsed.item_name) {
          chatBuffer.push(parsed);
          console.log("[수신]", parsed);
          if (chatBuffer.length > MAX_BUFFER) {
            chatBuffer.shift();
          }
          console.log("[수신]", parsed.user_nick, ":", parsed.msg || parsed.item_name);
        }
      } catch (e) {
        console.error("메시지 파싱 실패:", e);
      }
    });

    ws.on('close', () => {
      console.log("WebSocket 연결 종료");
      state = 'disconnected';
      setTimeout(() => connectToSoop(bjid), 3000);
    });

    ws.on('error', (err) => {
      console.error("WebSocket 오류:", err);
      ws.close();
    });
  } catch (e) {
    console.error("SOOP 연결 실패:", e);
    state = 'disconnected';
  }
}

// HTTP GET → 버퍼된 채팅 반환
app.get('/soop-buffer', (req, res) => {
  res.json(chatBuffer);
});

// 시작 시 bjid 연결
const bjid = process.env.BJID || 'madaomm';
connectToSoop(bjid);

app.listen(PORT, () => {
  console.log(`SOOP 프록시 서버 실행 중: http://localhost:${PORT}`);
});
