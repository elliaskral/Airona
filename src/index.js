import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  Events,
  PermissionFlagsBits,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import 'dotenv/config';

// 🧠 Inicializace klienta
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.commands = new Collection();
const commands = [];

// 📂 Cesty
const commandsPath = path.join(process.cwd(), 'src', 'commands');

// 🔹 1️⃣ Načti příkazy z hlavní složky
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = (await import(pathToFileURL(filePath))).default;

  if (command?.data && command?.execute) {
    const cmdJSON = command.data.toJSON();

    // ✅ Aplikace default_member_permissions (např. jen admin)
    if (command.data.default_member_permissions) {
      cmdJSON.default_member_permissions = command.data.default_member_permissions.bitfield.toString();
    }

    client.commands.set(command.data.name, command);
    commands.push(cmdJSON);
    console.log(`✅ Načten příkaz: ${command.data.name}`);
  } else {
    console.warn(`⚠️ Soubor ${file} nemá správnou strukturu.`);
  }
}

// 🔹 2️⃣ Načti příkazy z podsložek
const folders = fs.readdirSync(commandsPath).filter(file =>
  fs.lstatSync(path.join(commandsPath, file)).isDirectory()
);

for (const folder of folders) {
  const folderPath = path.join(commandsPath, folder);
  const folderFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

  for (const file of folderFiles) {
    const filePath = path.join(folderPath, file);
    const command = (await import(pathToFileURL(filePath))).default;

    if (command?.data && command?.execute) {
      const cmdJSON = command.data.toJSON();

      // ✅ Aplikace default_member_permissions (např. jen admin)
      if (command.data.default_member_permissions) {
      const perms = command.data.default_member_permissions;
      cmdJSON.default_member_permissions = perms.bitfield
      ? perms.bitfield.toString()
      : perms.toString();
}


      client.commands.set(command.data.name, command);
      commands.push(cmdJSON);
      console.log(`✅ Načten příkaz: ${command.data.name} (složka ${folder})`);
    } else {
      console.warn(`⚠️ Soubor ${file} ve složce ${folder} nemá správnou strukturu.`);
    }
  }
}

// 🪄 Po přihlášení bota
client.once(Events.ClientReady, async () => {
  console.log(`✅ Přihlášen jako ${client.user.tag}`);

  // 🌍 Registrace slash příkazů automaticky
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    console.log('🔄 Registruji slash příkazy...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log(`✨ Slash příkazy úspěšně registrovány (${commands.length} příkazů).`);
  } catch (error) {
    console.error('💥 Chyba při registraci příkazů:', error);
  }

  // 🟢 Nastavení statusu
  client.user.setPresence({
    activities: [{ name: 'Blue Protocol Star Resonance 💫', type: 0 }],
    status: 'online',
  });
});

// ⚙️ Zpracování příkazů
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // ✅ Pokud příkaz vyžaduje admina a uživatel ho nemá
  const member = interaction.member;
  if (
    command.data.default_member_permissions === PermissionFlagsBits.Administrator &&
    !member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return interaction.reply({
      content: '⛔ Tento příkaz mohou použít pouze administrátoři.',
      ephemeral: true,
    });
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Chyba při vykonávání příkazu ${interaction.commandName}:`, error);
    if (!interaction.replied) {
      await interaction.reply({
        content: '💥 Nastala chyba při vykonávání tohoto příkazu!',
        ephemeral: true,
      });
    }
  }
});

// 🚪 Připojení bota
client.login(process.env.TOKEN);
