import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'data', 'serverConfig.json');

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Launch the Airona configuration wizard.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // ✅ Pouze admini
    .setDMPermission(false),

  async execute(interaction) {
    // 🔒 Kontrola admin oprávnění
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '<:CrossMark:1433281172888223786> You need **Administrator** permissions to use this command.',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: false }); // 🔹 Viditelné pro všechny

    // 🟩 Kontrola existující konfigurace
    let existingConfig = null;
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (data.guildId === interaction.guild.id) existingConfig = data;
    }

    // 🟡 Pokud už existuje setup, zobraz potvrzení o přepsání
    if (existingConfig) {
      const overwriteEmbed = new EmbedBuilder()
        .setTitle('<:Warning:1433282518043332778> Airona is already configured on this server')
        .setDescription(
          `Existing configuration found:\n\n` +
            `**🔧 Admin Role:** <@&${existingConfig.adminRole}>\n` +
            `**🗂️ Category:** <#${existingConfig.category}>\n\n` +
            `Do you want to **overwrite the existing setup** with a new one?`
        )
        .setColor('#FFD166');

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('confirm-overwrite')
          .setLabel('✅ Overwrite')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel-overwrite')
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ embeds: [overwriteEmbed], components: [confirmRow] });

      const confirmation = await interaction.channel
        .awaitMessageComponent({
          filter: i => i.user.id === interaction.user.id,
          time: 30000,
        })
        .catch(() => null);

      if (!confirmation) {
        return interaction.editReply({
          content: '<:Clock:1433282516558676060> Setup timed out. Process canceled.',
          embeds: [],
          components: [],
        });
      }

      if (confirmation.customId === 'cancel-overwrite') {
        await confirmation.update({
          content: '<:CrossMark:1433281172888223786> Setup has been canceled.',
          embeds: [],
          components: [],
        });
        return;
      }

      await confirmation.update({
        content: '<:Trash:1433282514134499399> Removing old setup...',
        embeds: [],
        components: [],
      });

      // 🧹 Smazání starých kanálů a kategorie
      const guild = interaction.guild;
      try {
        if (existingConfig.channels) {
          for (const channelId of Object.values(existingConfig.channels)) {
            const channel = guild.channels.cache.get(channelId);
            if (channel) await channel.delete().catch(() => {});
          }
        }
        const oldCategory = guild.channels.cache.get(existingConfig.category);
        if (oldCategory) await oldCategory.delete().catch(() => {});
      } catch (err) {
        console.error('Error deleting old configuration:', err);
      }

      await interaction.editReply({
        content: '<:Jigsaw:1433282512704245800> Old setup removed. Continuing with new configuration...',
      });
    }

    // 🟩 Embed pro výběr admin role
    const embed = new EmbedBuilder()
      .setTitle('<:Tools:1433282510724399154> Airona Setup Wizard')
      .setDescription('Select the role that will have administrative access to Airona.')
      .setColor('#85d385');

    const roles = interaction.guild.roles.cache
      .filter(role => role.name !== '@everyone')
      .map(role => ({
        label: role.name,
        value: role.id,
      }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-admin-role')
      .setPlaceholder('Select administrator role...')
      .addOptions(roles.slice(0, 25));

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.editReply({ content: '', embeds: [embed], components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 60000,
    });

    collector.on('collect', async i => {
      if (i.customId === 'select-admin-role') {
        const selectedRoleId = i.values[0];
        const selectedRole = interaction.guild.roles.cache.get(selectedRoleId);
        await i.deferUpdate();

        const everyoneRole = interaction.guild.roles.everyone;

        // 🟩 Kategorie s omezeným přístupem
        const category = await interaction.guild.channels.create({
          name: 'Airona System',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
            {
              id: selectedRole.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages,
              ],
            },
            { id: interaction.client.user.id, allow: [PermissionFlagsBits.Administrator] },
          ],
        });

        // 🟩 Vytvoření Airona Updates a Airona Logs
        const channelsToCreate = ['airona-updates', 'airona-logs'];
        const createdChannels = {};

        for (const channelName of channelsToCreate) {
          const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              {
                id: selectedRole.id,
                allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ReadMessageHistory,
                ],
              },
              { id: interaction.client.user.id, allow: [PermissionFlagsBits.Administrator] },
            ],
          });

          createdChannels[channelName] = channel.id;
        }

        // 💾 Uložení nové konfigurace
        const serverData = {
          guildId: interaction.guild.id,
          adminRole: selectedRole.id,
          category: category.id,
          channels: createdChannels,
        };
        fs.writeFileSync(configPath, JSON.stringify(serverData, null, 2));

        // ✅ Finální potvrzení
        const doneEmbed = new EmbedBuilder()
          .setTitle('<:CheckMark:1433281155448442880> Airona Setup Complete!')
          .setDescription(
            `Airona has been successfully configured on this server.\n\n` +
              `**📋 Configuration Summary:**\n` +
              `> 🔧 **Admin Role:** <@&${selectedRole.id}>\n` +
              `> 🗂️ **Category:** ${category.name}\n` +
              `> 💬 **Channels:** <#${createdChannels['airona-updates']}>, <#${createdChannels['airona-logs']}>\n\n` +
              `**🔎 Next Steps:**\n` +
              `- Find updates and announcements in <#${createdChannels['airona-updates']}>\n` +
              `- System logs will appear in <#${createdChannels['airona-logs']}>\n` +
              `- Use **/setup-reset** anytime to reset and reconfigure Airona.\n\n` +
              `Thank you for using Airona <:Festa:1433282509092814949>`
          )
          .setColor('#85d385');

        await interaction.editReply({ embeds: [doneEmbed], components: [] });
        collector.stop();
      }
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        await interaction.editReply({
          content: '<:Clock:1433282516558676060> Setup expired, please run the command again.',
          embeds: [],
          components: [],
        });
      }
    });
  },
};
