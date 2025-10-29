export default {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`✅ Přihlášen jako ${client.user.tag}`);
  },
};