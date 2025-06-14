// loginSoop.js
const axios = require("axios").default;
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

async function loginSoop(id, pw) {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar }));

  const res = await client.post(
    "https://login.afreecatv.com/app/LoginAction.php",
    new URLSearchParams({
      m_id: id,
      m_pwd: pw,
      mode: "login",
      from: "main",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://www.afreecatv.com/",
        "User-Agent": "Mozilla/5.0",
      },
    }
  );

  if (!res.headers["set-cookie"]) {
    throw new Error("로그인 실패 (쿠키 없음)");
  }

  console.log("✅ SOOP 로그인 성공");
  return { client, jar };
}

module.exports = loginSoop;
