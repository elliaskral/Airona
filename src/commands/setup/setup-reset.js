import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} from 'discord.js';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'data', 'serverConfig.json');

export default {
  data: new SlashCommandBuilder()
    .setName('setup-reset')
    .setDescription('Reset Airona configuration on this server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    // 🔒 Pouze admin může spustit příkaz
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '<:CrossMark:1433281172888223786> You need **Administrator** permissions to use this command.',
        ephemeral: true,
      });
    }

    // 📂 Kontrola, jestli existuje konfigurace
    if (!fs.existsSync(configPath)) {
      return interaction.reply({
        content: '<:Warning:1433282518043332778> No existing configuration found to reset.',
        ephemeral: true,
      });
    }

    const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (data.guildId !== interaction.guild.id) {
      return interaction.reply({
        content: '<:Warning:1433282518043332778> This server does not have a saved configuration.',
        ephemeral: true,
      });
    }

    // ⚙️ Embed s potvrzením resetu
    const confirmEmbed = new EmbedBuilder()
      .setTitle('<:Warning:1433282518043332778> Confirm Airona Reset')
      .setDescription(
        `This will **delete all Airona channels, categories, and configuration data** for this server.\n\n` +
          `Are you sure you want to continue?`
      )
      .setColor('#FFD166');

    const confirmButtons = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('confirm-reset')
    .setEmoji('1433281155448442880') // ✅ Custom emoji ID
    .setLabel('Confirm Reset')
    .setStyle(ButtonStyle.Danger),
  new ButtonBuilder()
    .setCustomId('cancel-reset')
    .setEmoji('1433281172888223786') // ❌ Custom emoji ID
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary)
);


    await interaction.reply({
      embeds: [confirmEmbed],
      components: [confirmButtons],
      ephemeral: false,
    });

    const confirmation = await interaction.channel
      .awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id,
        time: 30000,
      })
      .catch(() => null);

    // ⏰ Timeout
    if (!confirmation) {
      return interaction.editReply({
        content: '<:Clock:1433282516558676060> Reset timed out. Process canceled.',
        embeds: [],
        components: [],
      });
    }

    // ❌ Zrušení
    if (confirmation.customId === 'cancel-reset') {
      await confirmation.update({
        content: '<:CrossMark:1433281172888223786> Reset canceled.',
        embeds: [],
        components: [],
      });
      return;
    }

    // 🧹 Mazání konfigurace
    await confirmation.update({
      content: '<:Trash:1433282514134499399> Removing old setup...',
      embeds: [],
      components: [],
    });

    const guild = interaction.guild;

    try {
      // 🗑️ Smazání kanálů
      if (data.channels) {
        for (const channelId of Object.values(data.channels)) {
          const channel = guild.channels.cache.get(channelId);
          if (channel) await channel.delete().catch(() => {});
        }
      }

      // 🗂️ Smazání kategorie
      const category = guild.channels.cache.get(data.category);
      if (category) await category.delete().catch(() => {});

      // 🧾 Smazání záznamu
      fs.unlinkSync(configPath);
    } catch (err) {
      console.error('Error deleting configuration:', err);
      return interaction.editReply({
        content: '<:CrossMark:1433281172888223786> Error occurred while resetting configuration.',
      });
    }

    // ✅ Potvrzení
    const doneEmbed = new EmbedBuilder()
      .setTitle('<:CheckMark:1433281155448442880> Airona Reset Complete')
      .setDescription(
        `All Airona configuration data has been successfully removed from this server.\n\n` +
          `You can now run **/setup** again to start a fresh configuration.\n\n` +
          `<:Festa:1433282509092814949> Thank you for using Airona!`
      )
      .setColor('#85d385');

    await interaction.editReply({ content: '', embeds: [doneEmbed], components: [] });
  },
};
