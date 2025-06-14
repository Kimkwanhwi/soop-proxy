// render-server.js – 로그인 기반 SOOP 채팅 수집 서버 (HTML 입력 + 로그아웃)

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const WebSocket = require('ws');
const loginAfreeca = require('./loginAfreeca');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

let chatBuffer = [];
let ws = null;

app.use(express.urlencoded({ extended: true }));

function createPacket(svc, dataList) {
  const ESC = String.fromCharCode(0x1b);
  const TAB = "\t";
  const body = buildBody(dataList);
  const header = [
    ESC,
    TAB,
    svc.toString().padStart(4, "0"),
    body.length.toString().padStart(6, "0"),
    "00",
  ].join("");

  return Buffer.concat([
    Buffer.from(header, "utf-8"), Buffer.from(body, "utf-8")]);
}

function buildBody(dataList) {
  return dataList.map(item => "\f" + item).join("") + "\f";
}

const SVC_LOGIN = 7100;
const SVC_JOINCH = 7101;
const SVC_KEEPALIVE = 7103;
const SVC_CHATMESG = 7160;

function parseSVC(buffer) {
  return parseInt(buffer.subarray(2, 6).toString("utf-8"));
}

async function fetchBJInfo(bjid, client) {
  const res = await client.post(
    `https://live.sooplive.co.kr/afreeca/player_live_api.php?bjid=${bjid}`,
    `bid=${bjid}&type=live&player_type=html5`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://play.sooplive.co.kr/',
      },
    }
  );

  const data = res.data;
  if (data.CHANNEL.RESULT !== 1) throw new Error("방송 중이 아닙니다.");

  return {
    chat_url: `wss://${data.CHANNEL.CHDOMAIN}:${parseInt(data.CHANNEL.CHPT) + 1}/Websocket/${bjid}`,
    tk: data.CHANNEL.TK || "",
    ftk: data.CHANNEL.FTK,
    chatno: data.CHANNEL.CHATNO,
    bjid,
  };
}

app.get("/login-form", (req, res) => {
  res.send(`
    <form method="POST" action="/login-and-connect">
      <input name="id" placeholder="아프리카 ID" required />
      <input name="pw" placeholder="비밀번호" type="password" required />
      <input name="bjid" placeholder="BJ ID" required />
      <button type="submit">채팅 수집 시작</button>
    </form>
  `);
});

app.post('/login-and-connect', async (req, res) => {
  const { id, pw, bjid } = req.body;
  if (!id || !pw || !bjid) return res.send('모든 항목을 입력해주세요.');

  try {
    const { client, jar } = await loginAfreeca(id, pw);
    const info = await fetchBJInfo(bjid, client);
    const cookies = await jar.getCookieString(info.chat_url);

    ws = new WebSocket(info.chat_url, 'chat', {
      headers: { Cookie: cookies }
    });

    ws.on('open', () => {
      console.log('✅ WebSocket 연결됨');
      ws.send(createPacket(SVC_LOGIN, [info.tk, '', '512']));
      setInterval(() => {
        ws.send(createPacket(SVC_KEEPALIVE, []));
      }, 20000);
    });

    ws.on('message', (data) => {
      const svc = parseSVC(data);
      const body = data.subarray(14).toString('utf-8').split('\f');
      if (svc === SVC_CHATMESG) {
        const chat = {
          user_id: body[2],
          user_nick: body[3],
          msg: body[11],
          raw: body,
        };
        chatBuffer.push(chat);
        if (chatBuffer.length > 200) chatBuffer.shift();
        console.log('[수신]', chat);
      }
    });

    res.send(`✅ ${bjid} 채팅 수집 시작됨<br><a href="/soop-buffer">채팅 보기</a> | <a href="/logout">로그아웃</a>`);
  } catch (e) {
    console.error(e);
    res.send('❌ 오류: ' + e.message);
  }
});

app.get("/logout", (req, res) => {
  if (ws) {
    ws.close();
    ws = null;
    chatBuffer = [];
    console.log("🚪 로그아웃: WebSocket 연결 종료됨");
  }
  res.send("✅ 로그아웃 완료<br><a href=\"/login-form\">다시 로그인</a>");
});

app.get("/soop-buffer", (req, res) => {
  res.json(chatBuffer);
});

app.listen(PORT, () => {
  console.log(`🚀 SOOP 서버 실행 중: http://localhost:${PORT}`);
});
