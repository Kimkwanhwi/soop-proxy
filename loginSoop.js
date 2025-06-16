const axios = require("axios").default;
const { CookieJar } = require("tough-cookie");
const axiosCookieJarSupport = require("axios-cookiejar-support").default;

// axios에 쿠키저장소 연결
axiosCookieJarSupport(axios);

const jar = new CookieJar();
const client = axios.create({
  jar,
  withCredentials: true,
});

/**
 * SOOP 로그인 함수
 * @param {string} id - 사용자 ID
 * @param {string} pw - 사용자 PW
 * @returns {{ client: AxiosInstance, cookies: string }} 로그인 클라이언트와 쿠키
 */
async function loginSoop(id, pw) {
  if (!id || !pw) {
    throw new Error("❌ ID 또는 PW가 비어 있습니다.");
  }

  // STEP 1. 세션 쿠키 획득 (CSRF 및 PHPSESSID 확보)
  await client.get("https://login.sooplive.co.kr/app/LoginForm.php", {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": "https://play.sooplive.co.kr/",
    },
  });

  console.log("🧩 초기 세션 쿠키:", await jar.getCookies("https://login.sooplive.co.kr"));
  
  // STEP 2. 로그인 시도
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
        "Referer": "https://play.sooplive.co.kr/",
      },
    }
  );

 // 로그인 후 쿠키 로그 출력
  const cookies = await jar.getCookies("https://login.sooplive.co.kr");
  console.log("🍪 로그인 후 쿠키:", cookies);

  // AuthTicket 검사
  const auth = cookies.find((c) => c.key === "AuthTicket");

  if (!auth) {
    console.log("❌ AuthTicket 없음, 로그인 실패");
    return { success: false, error: "❌ 로그인 실패 (AuthTicket 없음)" };
  }

  console.log("✅ 로그인 성공");
  return { success: true, cookie: cookies };
}

module.exports = loginSoop;
