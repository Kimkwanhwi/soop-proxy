const axios = require("axios").default;
const { CookieJar } = require("tough-cookie");
const { AxiosCookieJarSupport } = require("axios-cookiejar-support");

// axios 인스턴스에 쿠키 지원을 수동으로 적용
async function loginSoop(id, pw) {
  const jar = new CookieJar();
  const client = axios.create({ jar, withCredentials: true });
  AxiosCookieJarSupport(client); // wrapper 대신 이걸 직접 호출

  const res = await client.post(
    "https://login.sooplive.co.kr/app/LoginAction.php",
    new URLSearchParams({
      szUid: id,
      szPassword: pw,
      szWork: "login"
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
