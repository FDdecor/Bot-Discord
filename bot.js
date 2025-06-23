const { Client, GatewayIntentBits, Partials } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel], // 必要才能收到 DM
});

client.once('ready', () => {
  console.log(`✅ Bot 已上線：${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // 忽略 Bot 的訊息

  const userInput = message.content;
  const isDM = message.channel.type === 1; // 1 表示 DMChannel

  // 回應訊息
  if (isDM) {
    await message.reply(`📨 我收到你的私人訊息：「${userInput}」`);
  } else {
    await message.reply(`📢 你在伺服器說了：「${userInput}」`);
  }

  // 發送到 n8n webhook
  try {
    await axios.post(process.env.N8N_WEBHOOK_URL, {
      user: message.author.username,
      content: userInput,
      channel: isDM ? 'DM' : 'Server',
    });
    console.log('✅ 成功傳送訊息到 n8n');
  } catch (err) {
    console.error('❌ 傳送 n8n 失敗：', err.message);
  }
});

client.login(process.env.DISCORD_TOKEN);
