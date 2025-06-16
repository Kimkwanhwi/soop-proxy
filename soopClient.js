// soopClient.js
const axios = require("axios").default;
const tough = require("tough-cookie");
const WebSocket = require("ws");
const { URLSearchParams } = require("url");
const EventEmitter = require("events");

const CHAT_URL = (domain, port, bjid) => `wss://${domain}:${port}/Websocket/${bjid}`;
const SERVICE_CODE = {
  SVC_LOGIN: 1000,
  SVC_JOINCH: 1001,
  SVC_CHATMESG: 1002,
  SVC_KEEPALIVE: 1003,
};

function createPacket(svc, data) {
  const buildPacket = data.map((d) => "\f" + d).join("") + "\f";
  const body = Buffer.from(buildPacket, "utf-8");
  const header = Buffer.from(
    `\u001b\t${svc.toString().padStart(4, "0")}${body.length.toString().padStart(6, "0")}00`,
    "utf-8"
  );
  return Buffer.concat([header, body]);
}

class SoopChatClient extends EventEmitter {
  constructor(id, pw, bjid) {
    super();
    this.id = id;
    this.pw = pw;
    this.bjid = bjid;
    this.cookieJar = new tough.CookieJar();
    this.ws = null;
  }

  async login() {
    const res = await axios.post(
      "https://login.sooplive.co.kr/app/LoginAction.php",
      new URLSearchParams({
        szUid: this.id,
        szPassword: this.pw,
        szWork: "login",
      }),
      {
        jar: this.cookieJar,
        withCredentials: true,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const cookies = res.headers["set-cookie"];
    if (!cookies || !cookies.find((c) => c.includes("AuthTicket"))) {
      throw new Error("❌ 로그인 실패: 쿠키 없음");
    }

    console.log("✅ 로그인 성공");
  }

  async fetchBJInfo() {
    const res = await axios.post(
      `https://live.sooplive.co.kr/afreeca/player_live_api.php?bjid=${this.bjid}`,
      new URLSearchParams({
        bid: this.bjid,
        type: "live",
        player_type: "html5",
      }),
      {
        jar: this.cookieJar,
        withCredentials: true,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: await this.cookieJar.getCookieString("https://live.sooplive.co.kr"),
        },
      }
    );

    const data = res.data;
    if (data.CHANNEL.RESULT !== 1) {
      throw new Error("방송중이 아닙니다");
    }

    this.chatInfo = {
      chatUrl: CHAT_URL(data.CHANNEL.CHDOMAIN, data.CHANNEL.CHPT, this.bjid),
      tk: data.CHANNEL.TK,
      chatno: data.CHANNEL.CHATNO,
      ftk: data.CHANNEL.FTK,
    };
  }

  async connect() {
    await this.login();
    await this.fetchBJInfo();

    this.ws = new WebSocket(this.chatInfo.chatUrl);

    this.ws.on("open", () => {
      console.log("✅ WebSocket 연결됨");
      this.ws.send(
        createPacket(SERVICE_CODE.SVC_LOGIN, [
          this.chatInfo.tk || "",
          "",
          "1048576", // GUEST 권한
        ])
      );
    });

    this.ws.on("message", (data) => {
      if (!Buffer.isBuffer(data)) return;
      const header = data.slice(0, 14);
      const body = data.slice(14);

      const svc = parseInt(header.slice(2, 6).toString());

      if (svc === SERVICE_CODE.SVC_LOGIN) {
        this.ws.send(
          createPacket(SERVICE_CODE.SVC_JOINCH, [
            this.chatInfo.chatno,
            this.chatInfo.ftk,
            "0",
            "",
            "",
          ])
        );
        return;
      }

      if (svc === SERVICE_CODE.SVC_CHATMESG) {
        const parts = body.toString("utf-8").split("\f").filter(Boolean);
        const chat = {
          nickname: parts[2],
          message: parts[11],
        };
        this.emit("chat", chat);
      }
    });

    this.ws.on("close", () => {
      console.log("🔌 WebSocket 연결 종료됨");
    });

    setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(createPacket(SERVICE_CODE.SVC_KEEPALIVE, []));
      }
    }, 20000);
  }

  async start() {
    try {
      await this.connect();
    } catch (e) {
      console.error("❌ 에러:", e.message);
    }
  }
}

module.exports = SoopChatClient;
