import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Zkontroluje latenci bota.'),
  async execute(interaction) {
    await interaction.reply(`🏓 Pong! Latence: ${interaction.client.ws.ping} ms`);
  },
};
