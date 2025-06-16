// index.js
const express = require("express");
const bodyParser = require("body-parser");
const loginSoop = require("./loginSoop");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

app.post("/login", async (req, res) => {
  const { id, pw } = req.body;

  try {
    await loginSoop(id, pw);
    res.json({ success: true, message: "✅ 로그인 성공" });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SOOP 로그인 서버 실행 중: http://localhost:${PORT}`);
});
