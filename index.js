// index.js – SOOP 채팅 수집 서버 (로그인 기반)

const express = require("express");
const SoopChatClient = require("./soopClient");

const app = express();
app.use(express.json());

let chatLogs = [];

app.post("/start-chat", async (req, res) => {
  const { id, pw, bjid } = req.body;
  const client = new SoopChatClient(id, pw, bjid);

  client.on("chat", (chat) => {
    console.log(`[${chat.nickname}]: ${chat.message}`);
    chatLogs.push(chat);
  });

  await client.start();
  res.send("채팅 수집 시작됨");
});

app.get("/chat-logs", (req, res) => {
  res.json(chatLogs);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});

