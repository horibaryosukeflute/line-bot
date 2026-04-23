const express = require("express");
const app = express();
app.use(express.json());

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// ★ここに店舗携帯のuserId
const ALLOWED_USER_ID = "Ue9d71e1a7dcee48d51fc0c35b424f63d";

app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  for (const event of events) {

    // メッセージじゃない場合は無視
    if (event.type !== "message") continue;

    // ★許可ユーザー以外は無視
    if (event.source.userId !== ALLOWED_USER_ID) {
      console.log("NGユーザー:", event.source.userId);
      continue;
    }

    // テキスト処理
    if (event.message.type === "text") {
      const text = event.message.text;

      await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LINE_TOKEN}`,
        },
        body: JSON.stringify({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: `受付OK：「${text}」`,
            },
          ],
        }),
      });
    }

    // 画像処理（確認用）
    if (event.message.type === "image") {
      await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LINE_TOKEN}`,
        },
        body: JSON.stringify({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: "画像受け取った👍",
            },
          ],
        }),
      });
    }
  }

  res.sendStatus(200);
});

app.listen(10000, () => console.log("Server running"));
