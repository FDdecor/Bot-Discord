const { Client, GatewayIntentBits, Partials, ChannelType } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`✅ Bot 已上線：${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const userInput = message.content;
  const isDM = message.channel.type === ChannelType.DM;

  try {
    const response = await axios.post(process.env.N8N_CHAT_TRIGGER_URL, {
      messenger: 'discord',
      userId: message.author.id,
      userName: message.author.username,
      content: userInput,
      channel: isDM ? 'DM' : 'Server',
    });

    const reply = response.data;

    if (Array.isArray(reply) && reply.length > 0) {
      for (const item of reply) {
        if (item.type === 'text' && item.content) {
          await message.reply(item.content);
        }
        // 可依需求加處理其他類型，例如 image、link、file、audio 等
        else {
          // 目前未支援的類型，可以回覆提示或忽略
          console.warn('收到未知類型訊息:', item.type);
        }
      }
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
