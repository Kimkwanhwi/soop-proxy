// Render용 SOOP WebSocket 채팅 수집 서버

const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 10000;

let chatBuffer = []; // 채팅 저장 버퍼
let ws = null;

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
    Buffer.from(header, "utf-8"),
    Buffer.from(body, "utf-8"),
  ]);
}

function buildBody(dataList) {
  return dataList.map(item => "\f" + item).join("") + "\f";
}

const SVC_LOGIN = 7100;
const SVC_JOINCH = 7101;
const SVC_KEEPALIVE = 7103;
const SVC_CHATMESG = 7160;

async function fetchBJInfo(bjid) {
  const url = `https://live.sooplive.co.kr/afreeca/player_live_api.php?bjid=${bjid}`;
  const res = await axios.post(url, `bid=${bjid}&type=live&player_type=html5`);
  const data = res.data;

  if (data.CHANNEL.RESULT !== 1) {
    throw new Error("방송 중이 아닙니다.");
  }

  return {
    chat_url: `ws://${data.CHANNEL.CHDOMAIN}:${data.CHANNEL.CHPT}/Websocket/${bjid}`,
    tk: data.CHANNEL.TK || "",
    ftk: data.CHANNEL.FTK,
    chatno: data.CHANNEL.CHATNO,
    bjid,
  };
}

function parseSVC(buffer) {
  return parseInt(buffer.subarray(2, 6).toString("utf-8"));
}

async function connectToChat(bjid) {
  const info = await fetchBJInfo(bjid);
  ws = new WebSocket(info.chat_url, []);

  ws.on("open", () => {
    console.log("✅ WebSocket 연결됨");
    const loginPacket = createPacket(SVC_LOGIN, [info.tk, "", "512"]);
    ws.send(loginPacket);

    setInterval(() => {
      const keepAlive = createPacket(SVC_KEEPALIVE, []);
      ws.send(keepAlive);
    }, 20000);
  });

  ws.on("message", (data) => {
    const svc = parseSVC(data);
    const body = data.subarray(14).toString("utf-8").split("\f");
    if (svc === SVC_CHATMESG) {
      const chat = {
        user_id: body[2],
        user_nick: body[3],
        msg: body[11],
        raw: body,
      };
      chatBuffer.push(chat);
      if (chatBuffer.length > 200) chatBuffer.shift();
      console.log("[수신]", chat);
    }
  });

  ws.on("close", () => {
    console.log("🔌 WebSocket 연결 종료됨");
  });

  ws.on("error", (err) => {
    console.error("❌ WebSocket 오류:", err);
  });
}

app.get("/soop-chat", async (req, res) => {
  const bjid = req.query.bjid;
  if (!bjid) return res.status(400).send("bjid 파라미터가 필요합니다.");
  try {
    await connectToChat(bjid);
    res.send("✅ WebSocket 연결 시도 완료");
  } catch (e) {
    res.status(500).send("❌ 연결 실패: " + e.message);
  }
});

app.get("/soop-buffer", (req, res) => {
  res.json(chatBuffer);
});

app.listen(PORT, () => {
  console.log(`🚀 SOOP 프록시 서버 실행 중: http://localhost:${PORT}`);
});
