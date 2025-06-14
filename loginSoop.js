// loginSoop.js
const axios = require("axios").default;
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");

/**
 * SOOP 로그인
 * @param {string} id SOOP ID
 * @param {string} pw 비밀번호
 * @returns {Promise<{ client: any, jar: any }>}
 */
async function loginSoop(id, pw) {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar }));

  const loginRes = await client.post(
    "https://login.sooplive.co.kr/app/LoginAction.php",
    new URLSearchParams({
      szUid: id,
      szPassword: pw,
      szWork: "login"
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0"
      }
    }
  );

  // 쿠키 체크
  const cookies = await jar.getCookies("https://login.sooplive.co.kr");
  const cookieMap = Object.fromEntries(cookies.map(c => [c.key, c.value]));

  if (!cookieMap.AuthTicket) {
    throw new Error("❌ 로그인 실패 (AuthTicket 없음)");
  }

  // 쿠키를 헤더로 설정 (다른 요청용)
  const cookieHeader = cookies.map(c => `${c.key}=${c.value}`).join("; ");
  client.defaults.headers.Cookie = cookieHeader;

  console.log("✅ SOOP 로그인 성공");
  return { client, jar };
}

module.exports = loginSoop;
