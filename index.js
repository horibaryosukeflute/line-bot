const express = require("express");
const app = express();
app.use(express.json());

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// 店舗スマホの userId だけ許可
const ALLOWED_USER_ID = "Ue9d71e1a7dcee48d51fc0c35b424f63d";

async function replyMessage(replyToken, text) {
  const response = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [
        {
          type: "text",
          text,
        },
      ],
    }),
  });

  const body = await response.text();
  console.log("返信結果:", response.status, body);
}

app.post("/webhook", async (req, res) => {
  console.log("受信:", JSON.stringify(req.body, null, 2));

  try {
    const events = req.body.events || [];

    for (const event of events) {
      if (event.type !== "message") continue;

      const userId = event.source?.userId || "";

      // 店舗スマホ以外は無視
      if (userId !== ALLOWED_USER_ID) {
        console.log("許可外ユーザー:", userId);
        continue;
      }

      if (event.message.type === "text") {
        await replyMessage(event.replyToken, `受付OK：${event.message.text}`);
      }

      if (event.message.type === "image") {
        await replyMessage(event.replyToken, "画像受け取った👍");
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.error("エラー:", e);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
  res.send("サーバー起動OK");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
