// loginSoop.js
const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");

async function loginSoop(id, pw) {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar }));

  const res = await client.post(
    "https://login.sooplive.co.kr/app/LoginAction.php",
    new URLSearchParams({
      szUid: id,
      szPassword: pw,
      szWork: "login",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
      },
    }
  );

  if (!res.headers["set-cookie"]) {
    throw new Error("❌ 로그인 실패: 쿠키 없음");
  }

  console.log("✅ 로그인 성공");
  return { client, jar };
}

module.exports = loginSoop;
