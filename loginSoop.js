// loginSoop.js
const axios = require("axios").default;
const { CookieJar } = require("tough-cookie");
const axiosCookieJarSupport = require("axios-cookiejar-support"); // 전체 모듈 불러오기

async function loginSoop(id, pw) {
  const jar = new CookieJar();
  const client = axios.create({ jar });

  axiosCookieJarSupport.wrapper(client); // wrapper는 여기서 함수 실행됨

  const res = await client.post(
    "https://login.sooplive.co.kr/afreeca/login.php",
    new URLSearchParams({
      m_id: id,
      m_pwd: pw,
      mode: "login",
      from: "main",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://play.sooplive.co.kr/",
        "User-Agent": "Mozilla/5.0",
      },
    }
  );

  if (!res.headers["set-cookie"]) {
    throw new Error("❌ 로그인 실패 (쿠키 없음)");
  }

  console.log("✅ SOOP 로그인 성공");
  return { client, jar };
}

module.exports = loginSoop;
