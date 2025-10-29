import { EmbedBuilder, ChannelType, PermissionsBitField, Events } from 'discord.js';

export default {
  name: Events.GuildCreate,
  async execute(guild, client) {
    try {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('👋 Ahoj! Jsem Airona.')
        .setDescription(
          `Díky, že jsi mě přidal/a na server **${guild.name}**!\n\n` +
          `Zde je krátký průvodce:\n` +
          `• Použij \`/help\` pro zobrazení dostupných příkazů\n` +
          `• Nastav mě pomocí \`/setup\`\n\n` +
          `Jsem bot vytvořený pro komunitu **Blue Protocol Star Resonance** 💫`
        )
        .setFooter({ text: 'Airona v1 Community Edition' })
        .setTimestamp();

      // Najdi vhodný kanál, kam může bot psát
      const channel = guild.channels.cache.find(
        ch =>
          ch.type === ChannelType.GuildText &&
          ch.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)
      );

      if (channel) {
        await channel.send({ embeds: [embed] });
        console.log(`📨 Sent welcome guide to ${guild.name}`);
      } else {
        console.log(`⚠️  No writable channel found in ${guild.name}`);
      }
    } catch (err) {
      console.error(`❌ Error in guildCreate event:`, err);
    }
  },
};
