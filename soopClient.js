const WebSocket = require("ws");
const axios = require("axios");
const orjson = require("orjson-lite"); // orjson-like for decoding, use JSON if unavailable

const CHAT_URL_TEMPLATE = "wss://chat-{chdomain}.sooplive.co.kr:{port}/Websocket/{bjid}";

function createChatURL(info) {
  const port = parseInt(info.CHPT) + 1; // +1 for secure port
  return CHAT_URL_TEMPLATE
    .replace("{chdomain}", info.CHDOMAIN)
    .replace("{port}", port)
    .replace("{bjid}", info.BJID);
}

async function fetchBJInfo(client, bjid) {
  const form = new URLSearchParams();
  form.append("bid", bjid);
  form.append("type", "live");
  form.append("player_type", "html5");

  const res = await client.post(
    `https://live.sooplive.co.kr/afreeca/player_live_api.php?bjid=${bjid}`,
    form
  );

  const data = orjson.loads(res.data); // or JSON.parse if needed
  if (!data.CHANNEL || data.CHANNEL.RESULT !== 1) {
    throw new Error("방송이 시작되지 않았거나 존재하지 않습니다.");
  }
  return data.CHANNEL;
}

function connectToChat(chatUrl, info, onChatMessage) {
  const ws = new WebSocket(chatUrl);

  ws.on("open", () => {
    console.log("✅ WebSocket 연결됨");

    const loginPacket = createPacket(0x0fa0, [
      info.TK || "",
      "",
      "1" // guest flag
    ]);
    ws.send(loginPacket);
  });

  ws.on("message", (data) => {
    const msg = parsePacket(data);
    if (msg && msg.svc === 0x0fa1 && info.CHATNO && info.FTK) {
      const joinPacket = createPacket(0x0fa1, [
        info.CHATNO,
        info.FTK,
        "0",
        "",
        ""
      ]);
      ws.send(joinPacket);
    }

    if (msg && msg.svc === 0x0fa2 && msg.body.length > 10) {
      const [ , nick, , , , , , , , , message ] = msg.body;
      onChatMessage({ nickname: nick, message });
    }
  });

  ws.on("close", () => console.log("🔌 WebSocket 연결 종료됨"));
  ws.on("error", (err) => console.error("❌ WebSocket 오류:", err));
}

function createPacket(svc, data) {
  const body = Buffer.from(["\f" + data.join("\f") + "\f"].join(""), "utf-8");
  const header = Buffer.from(
    "\u001b\t" + svc.toString().padStart(4, "0") + body.length.toString().padStart(6, "0") + "00",
    "utf-8"
  );
  return Buffer.concat([header, body]);
}

function parsePacket(buffer) {
  if (buffer.length < 14) return null;

  const header = buffer.slice(0, 14).toString();
  const body = buffer.slice(14).toString("utf-8").split("\f");

  const svc = parseInt(header.slice(2, 6), 10);
  return { svc, body };
}

module.exports = {
  fetchBJInfo,
  connectToChat
};
