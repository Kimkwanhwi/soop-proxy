const express = require("express");
const bodyParser = require("body-parser");
const { WebSocket } = require("ws");
const loginSoop = require("./loginSoop");
const { buildPacket, parsePacket } = require("./soopPacket");

const app = express();
app.use(bodyParser.json());

let ws = null;
let chatBuffer = [];
let jar = null;
let client = null;

app.post("/login", async (req, res) => {
  const { id, pw } = req.body;
  try {
    const result = await loginSoop(id, pw);
    jar = result.jar;
    client = result.client;
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

app.get("/start-chat", async (req, res) => {
  const { bjid } = req.query;
  if (!client || !jar) return res.status(403).json({ error: "Not logged in" });

  try {
    const bjInfo = await fetchBjInfo(client, bjid);
    const url = bjInfo.chat_url.replace("http", "ws").replace("https", "wss");
    ws = new WebSocket(url);

    ws.on("open", () => {
      const loginPacket = buildPacket(3001, [bjInfo.tk, "", "0"]);
      ws.send(loginPacket);
    });

    ws.on("message", (data) => {
      const parsed = parsePacket(data);
      if (parsed.svc === 3003 && parsed.packet.length > 10) {
        const nickname = parsed.packet[3];
        const message = parsed.packet[4];
        chatBuffer.push({ nickname, message });
        if (chatBuffer.length > 100) chatBuffer.shift();
      }
    });

    ws.on("close", () => console.log("🔌 WebSocket 연결 종료됨"));
    ws.on("error", (err) => console.error("❌ WebSocket 오류:", err));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/soop-buffer", (req, res) => {
  res.json(chatBuffer);
});

const fetchBjInfo = async (client, bjid) => {
  const form = new URLSearchParams({ bid: bjid, type: "live", player_type: "html5" });
  const res = await client.post(
    "https://live.sooplive.co.kr/afreeca/player_live_api.php?bjid=" + bjid,
    form,
    { headers: { Referer: "https://play.sooplive.co.kr/" } }
  );

  const data = res.data.CHANNEL;
  if (data.RESULT !== 1) throw new Error("Not streaming");
  return {
    chat_url: `wss://${data.CHDOMAIN}:${data.CHPT}/Websocket/${bjid}`,
    chatno: data.CHATNO,
    ftk: data.FTK,
    tk: data.TK || "",
  };
};

app.listen(10000, () => {
  console.log("🚀 SOOP Proxy server running on http://localhost:10000");
});
