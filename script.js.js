import { Bot, InlineKeyboard } from "grammy";
import OpenAI from "openai";
import cron from "node-cron";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!BOT_TOKEN) {
  console.error("ОШИБКА: BOT_TOKEN не указан в .env!");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY || "dummy_key" });

let db;

async function initDatabase() {
  db = await open({
    filename: "./cayouthparliament.sqlite",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS delegates (
      user_id INTEGER PRIMARY KEY,
      username TEXT,
      full_name TEXT,
      country TEXT DEFAULT 'Центральная Азия',
      committee TEXT DEFAULT 'Общий',
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("База данных готова.");
}

const SYSTEM_PROMPT = `
Ты — официальный виртуальный координатор и интеллектуальный ассистент CA Youth Parliament.

ТОН И СТИЛЬ:
- Вдохновляющий, дружелюбный, поддерживающий и уважительно-деловой тон.
- Обращайся к пользователям: «Уважаемый делегат» или «Уважаемый коллега».

МИССИЯ:
- Помогать амбициозной молодёжи реализовывать идеи и развиваться в ключевых сферах будущего.

БАЗА ЗНАНИЙ (6 Департаментов):
1. Международные Отношения — симуляции, дипломатия.
2. Экология — проекты устойчивого развития.
3. Медиа — контент, SMM, фото/видео.
4. Журналистика — статьи, интервью.
5. Бизнес — стартапы, нетворкинг.
6. Образование — воркшопы, курсы.

БЕСПЛАТНЫЕ КУРСЫ: Английский, Турецкий, Французский, Central Asian Youth Academy.
АДРЕС ОФИСА: г. Алматы, ул. Байтурсынова 22/к1, 3 этаж (справа).
КОНТАКТЫ КООРДИНАТОРА ПО ПРОЕКТАМ: Telegram: @mmadybekovaa | Тел: +7 777 081 5921.

Правило: Если спрашивают про даты ближайшего ивента — отвечай, что анонс будет объявлен позже.
`;

bot.command("start", async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username || "";
  const fullName = `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim();

  await db.run(
    `INSERT OR REPLACE INTO delegates (user_id, username, full_name) VALUES (?, ?, ?)`,
    [userId, username, fullName]
  );

  await ctx.reply(
    `Приветствуем вас, **${ctx.from.first_name}**! ✨\n\n` +
      `Рады видеть вас в **CA Youth Parliament**!\n` +
      `Задайте мне любой вопрос о наших департаментах, курсах и проектах.`,
    { parse_mode: "Markdown" }
  );
});

bot.on("message:text", async (ctx) => {
  await ctx.replyWithChatAction("typing");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: ctx.message.text },
      ],
      temperature: 0.3,
    });

    await ctx.reply(completion.choices[0].message.content);
  } catch (error) {
    console.error("AI Error:", error);
    await ctx.reply(
      "Свяжитесь с нашим координатором:\n• Telegram: @mmadybekovaa\n• Телефон: +7 777 081 5921"
    );
  }
});

async function main() {
  await initDatabase();
  bot.start();
  console.log("🚀 Бот CA Youth Parliament успешно запущен!");
}

main().catch(console.error);