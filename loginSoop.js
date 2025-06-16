// loginSoop.js
const axios = require("axios");
const { CookieJar } = require("tough-cookie");
require("axios-cookiejar-support").default(axios); // ✅ wrapper 없이 default 직접 호출

async function loginSoop(id, pw) {
  if (!id || !pw) {
    throw new Error("❌ ID 또는 PW가 비어 있습니다.");
  }
  const jar = new CookieJar();
  const client = axios.create({
    jar,
    withCredentials: true,
  });

  const response = await client.post(
    "https://login.sooplive.co.kr/app/LoginAction.php",
    new URLSearchParams({
      szUid: id,
      szPassword: pw,
      szWork: "login",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://play.sooplive.co.kr/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    }
  );

  const cookies = jar.getCookiesSync("https://sooplive.co.kr");
  const cookieMap = {};
  for (const cookie of cookies) {
    cookieMap[cookie.key] = cookie.value;
  }
  console.log("🔍 쿠키 확인:", cookies);
  if (!cookieMap["AuthTicket"]) {
    throw new Error("❌ 로그인 실패 (AuthTicket 없음)");
  }

  console.log("✅ 로그인 성공");
  return {
    client,
    jar,
    cookieHeader: cookies.map(c => `${c.key}=${c.value}`).join("; "),
  };
}

module.exports = loginSoop;
