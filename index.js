// index.js
const express = require("express");
const bodyParser = require("body-parser");
const loginSoop = require("./loginSoop");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// 로그인 요청 API
app.post("/login", async (req, res) => {
  const { id, pw } = req.body;

  if (!id || !pw) {
    return res.status(400).json({ success: false, error: "ID와 PW를 입력하세요" });
  }

  try {
    const { client, jar, cookies } = await loginSoop(id, pw);

    // 필요시 쿠키 내용을 로깅하거나 다른 모듈로 넘길 수 있음
    console.log("로그인 쿠키:", cookies);

    res.json({ success: true, message: "✅ 로그인 성공", cookies });
  } catch (error) {
    console.error("❌ 로그인 에러:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🔓 SOOP 로그인 서버 실행 중: http://localhost:${PORT}`);
});

});
