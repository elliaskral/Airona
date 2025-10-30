import { Events, ActivityType } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Přihlášen jako ${client.user.tag}`);

    // Nastavení statusu
    client.user.setPresence({
      activities: [{ name: 'Dinkster stop being Indian faggot', type: ActivityType.Playing }],
      status: 'online',
    });
  },
};
