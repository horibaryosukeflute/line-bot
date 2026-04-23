const express = require("express");
const app = express();
app.use(express.json());

const { template1, template2 } = require("./templates");

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const ALLOWED_USER_ID = "Ue9d71e1a7dcee48d51fc0c35b424f63d";

// ユーザー状態管理（簡易）
let userState = {};

async function replyMessage(replyToken, text) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
}

app.post("/webhook", async (req, res) => {
  const events = req.body.events || [];

  for (const event of events) {
    if (event.type !== "message") continue;

    const userId = event.source.userId;

    // 店舗スマホ以外無視
    if (userId !== ALLOWED_USER_ID) continue;

    const message = event.message;

    // 初期化
    if (!userState[userId]) {
      userState[userId] = {};
    }

    // ① 画像受信
    if (message.type === "image") {
      userState[userId] = { step: "waiting_template" };

      await replyMessage(
        event.replyToken,
        "画像受け取ったよ👍\n\n① 貴金属・ブランド\n② 雑貨系\n\nどっち使う？（① or ②）"
      );
      continue;
    }

    // ② テンプレ選択
    if (userState[userId].step === "waiting_template") {
      if (message.text !== "①" && message.text !== "②") {
        await replyMessage(event.replyToken, "①か②だけ送ってね！");
        continue;
      }

      userState[userId].templateType = message.text;
      userState[userId].step = "waiting_word";

      await replyMessage(
        event.replyToken,
        `${message.text === "①" ? "テンプレ①（貴金属・ブランド）" : "テンプレ②（雑貨系）"}だね！\n\n「○○」に入れるワード送って👇`
      );
      continue;
    }

    // ③ ワード入力
    if (userState[userId].step === "waiting_word") {
      userState[userId].word = message.text;
      userState[userId].step = "confirm";

      await replyMessage(
        event.replyToken,
        `テンプレ${userState[userId].templateType}で「${message.text}」で投稿してOK？\n\nOK → 投稿\nキャンセル → やり直し`
      );
      continue;
    }

    // ④ 確認
    if (userState[userId].step === "confirm") {
      if (message.text === "OK") {
        const { templateType, word } = userState[userId];

        const baseTemplate =
          templateType === "①" ? template1 : template2;

        const finalText = baseTemplate.replace("○○", word);

        console.log("投稿内容:", finalText);

        // ★今はまだ投稿せずログだけ（次でGoogle連携）
        
        userState[userId] = {};

        await replyMessage(event.replyToken, "投稿完了したよ👍");
        continue;
      }

      if (message.text === "キャンセル") {
        userState[userId] = {};
        await replyMessage(event.replyToken, "キャンセルしたよ！");
        continue;
      }

      await replyMessage(event.replyToken, "OKかキャンセルで答えてね！");
    }
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running");
});
