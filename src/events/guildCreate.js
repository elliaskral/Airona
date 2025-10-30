import { EmbedBuilder, ChannelType, PermissionsBitField, Events, AttachmentBuilder } from 'discord.js';
import path from 'path';
import fs from 'fs';

export default {
  name: Events.GuildCreate,
  async execute(guild, client) {
    try {
      const imagePath = path.join(process.cwd(), 'src', 'images', 'setup.png');
      const attachment = new AttachmentBuilder(imagePath);

      const embed = new EmbedBuilder()
        .setColor(0x85d385)
        .setTitle('👋 Hi')
        .setDescription(
          `Thank you for adding me to your server **${guild.name}**!\n\n` +
          `Here is what you should do first:\n` +
          `• Use \`/help\` to view all available commands\n` +
          `• Set me up with \`/setup\`\n\n` +
          `I'm bot mainly for **Blue Protocol Star Resonance** 💫 community, but I can do even more than that.`
        )
        .setThumbnail('attachment://setup.png')
        .setFooter({ text: 'Airona v1.0' })
        .setTimestamp();

      const channel = guild.channels.cache.find(
        ch =>
          ch.type === ChannelType.GuildText &&
          ch.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)
      );

      if (channel) {
        await channel.send({ embeds: [embed], files: [attachment] });
        console.log(`📨 Sent welcome guide to ${guild.name}`);
      } else {
        console.log(`⚠️  No writable channel found in ${guild.name}`);
      }
    } catch (err) {
      console.error('❌ Error in guildCreate event:', err);
    }
  },
};
