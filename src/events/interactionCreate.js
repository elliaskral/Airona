import { Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`❌ Příkaz ${interaction.commandName} nebyl nalezen.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`⚠️ Chyba při provádění příkazu ${interaction.commandName}:`, error);
      await interaction.reply({
        content: '❗ Při spuštění příkazu došlo k chybě.',
        ephemeral: true,
      });
    }
  },
};
