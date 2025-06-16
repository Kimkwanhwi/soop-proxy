const axios = require("axios").default;
const { CookieJar } = require("tough-cookie");
const axiosCookieJarSupport = require("axios-cookiejar-support").default;

// axios 인스턴스에 쿠키 지원 추가
axiosCookieJarSupport(axios);

async function loginSoop(id, pw) {
  const jar = new CookieJar();

  const client = axios.create({
    jar,
    withCredentials: true,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Content-Type": "application/x-www-form-urlencoded",
      "Referer": "https://play.sooplive.co.kr/",
      "Origin": "https://play.sooplive.co.kr",
    },
  });

  try {
    const res = await client.post(
      "https://login.sooplive.co.kr/app/LoginAction.php",
      new URLSearchParams({
        szUid: id,
        szPassword: pw,
        szWork: "login",
      })
    );

    // 쿠키 정보 추출
    const setCookies = jar.getCookiesSync("https://sooplive.co.kr");
    console.log("🍪 로그인 후 쿠키:", setCookies);

    // AuthTicket 확인
    const authTicket = setCookies.find((c) => c.key === "AuthTicket");
    if (!authTicket) {
      return { success: false, error: "❌ 로그인 실패 (AuthTicket 없음)" };
    }

    return {
      success: true,
      message: "✅ 로그인 성공",
      cookies: setCookies.map((c) => `${c.key}=${c.value}`).join("; "),
    };
  } catch (err) {
    return {
      success: false,
      error: `❌ 로그인 요청 실패: ${err.message}`,
    };
  }
}

module.exports = loginSoop;
