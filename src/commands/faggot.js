import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('faggot')
    .setDescription('Secret command just for my homie Voden'),
  async execute(interaction) {
    await interaction.reply(`😭 Voden is gay`);
  },
};
