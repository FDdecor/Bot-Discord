const { Client, GatewayIntentBits, Partials } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel], // 必要才能收到 DM
});

client.once('ready', () => {
  console.log(`✅ Bot 已上線：${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const userInput = message.content;
  const isDM = message.channel.type === 'DM';

  // 傳送給 n8n，並等待回應
  try {
    const response = await axios.post(process.env.N8N_WEBHOOK_URL, {
      userId: message.author.id,
      message: userInput,
    });

    const reply = response.data;

    // 根據 n8n 回傳的格式作出不同的回應
    if (reply.content) {
      await message.reply(reply.content);
    } else if (reply.embeds) {
      await message.reply({ embeds: reply.embeds });
    } else if (reply.files) {
      await message.reply({ content: reply.content || '', files: reply.files });
    } else {
      await message.reply('⚠️ 收到未知格式的回應。');
    }

    console.log('✅ 回應已發送到 Discord 使用者');
  } catch (err) {
    console.error('❌ 與 n8n 溝通失敗：', err.message);
    await message.reply('❌ 無法取得 AI 回應，請稍後再試。');
  }
});

client.login(process.env.DISCORD_TOKEN);
