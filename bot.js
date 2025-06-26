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
  partials: [Partials.Channel], // 接收 DM
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

    if (!Array.isArray(reply)) {
      await message.reply('⚠️ 收到未知格式的回應（非陣列）。');
      console.warn('非陣列格式：', reply);
      return;
    }

    for (const item of reply) {
      if (!item || !item.type || !item.content) continue;

      switch (item.type) {
        case 'text':
        case 'link':
          await message.reply(item.content);
          break;
        case 'image':
        case 'file':
        case 'audio':
          await message.reply({ files: [item.content] });
          break;
        default:
          await message.reply(`⚠️ 收到不支援的訊息類型：${item.type}`);
          console.warn('未支援類型：', item);
          break;
      }
    }

    console.log('✅ 回應已發送到 Discord 使用者');
  } catch (err) {
    console.error('❌ 與 n8n 溝通失敗：', err.message);
    await message.reply('❌ 無法取得 AI 回應，請稍後再試。');
  }
});

client.login(process.env.DISCORD_TOKEN);
