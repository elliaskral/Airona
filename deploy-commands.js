import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// 🔹 Inicializace
const commands = [];
const commandsPath = path.join(process.cwd(), 'src', 'commands');

// 🧩 Funkce na načtení všech .js příkazů rekurzivně
function loadCommands(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      loadCommands(filePath);
    } else if (file.name.endsWith('.js')) {
      import(`file:///${filePath.replace(/\\/g, '/')}`)
        .then(module => {
          const command = module.default;
          if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`✅ Načten příkaz: ${command.data.name}`);
          } else {
            console.log(`⚠️  Soubor ${file.name} nemá správnou strukturu.`);
          }
        })
        .catch(err => console.error(`❌ Chyba při načítání ${file.name}:`, err));
    }
  }
}

await loadCommands(commandsPath);

// 🧠 Inicializace REST API
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// 🔹 IDs z .env
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// 📡 Registrace příkazů
try {
  console.log('\n🔄 Registruji slash příkazy...');

  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

  console.log(`\n✅ Úspěšně registrováno ${commands.length} příkazů pro server ${guildId}`);
  console.log('📦 Seznam příkazů:');
  commands.forEach(cmd => console.log(` • ${cmd.name}`));
} catch (error) {
  console.error('❌ Chyba při registraci příkazů:', error);
}
