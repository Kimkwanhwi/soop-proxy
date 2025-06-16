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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0",
    },
  });

  const loginUrl = "https://login.sooplive.co.kr/app/LoginAction.php";

  const response = await client.post(
    loginUrl,
    new URLSearchParams({
      szUid: id,
      szPassword: pw,
      szWork: "login",
    }).toString()
  );

  const cookies = await jar.getCookies(loginUrl);
  const auth = cookies.find(c => c.key === "AuthTicket");

  if (!auth) {
    throw new Error("❌ 로그인 실패 (AuthTicket 없음)");
  }

  const cookieHeader = cookies.map(c => `${c.key}=${c.value}`).join("; ");

  console.log("✅ 로그인 성공");
  console.log("🍪 쿠키:", cookieHeader);

  return { client, jar, cookieHeader };
}

module.exports = loginSoop;

