// index.js
const express = require("express");
const bodyParser = require("body-parser");
const loginSoop = require("./loginSoop");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

let currentSession = null; // 현재 로그인 세션 (client, jar, cookieHeader 포함)

app.post("/login", async (req, res) => {
  const { id, pw } = req.body;

  if (!id || !pw) {
    return res.status(400).json({ success: false, error: "ID와 PW를 입력하세요" });
  }

  try {
    const session = await loginSoop(id, pw);
    currentSession = session;

    return res.json({ success: true, message: "✅ 로그인 성공" });
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("SOOP 로그인 서버가 실행 중입니다.");
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
