const { GatewayIntentBits, Events, EmbedBuilder, Collection } = require("discord.js");
const { CustomClient } = require('./compiled/customClient.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require("./compiled/bot-config.json");

const client = new CustomClient({ intents: [GatewayIntentBits.Guilds] }, config);

async function main() {
  loadCommands();

  await client.database.connect()
  await client.database.firstData()

  interactionHandling();

  client.once(Events.ClientReady, () => {
    if (client.user) console.log(`Ready! Logged in as ${client.user.tag}`)
  });

  client.login(config.bot.token);
}


/**
 * @param {import("discord.js").Interaction<import("discord.js").CacheType>} interaction
 * @param {string | null} message
 */
async function respondError(interaction, message) {
  const embed = new EmbedBuilder()
    .setTitle("Handling misslyckades")
    .setDescription(message)
    .setColor("Red");
  if (!interaction.isRepliable()) return;
  if (!(interaction.replied || interaction.deferred)) { await interaction.reply({ embeds: [embed], ephemeral: true }); return; }
  await interaction.followUp({ embeds: [embed], ephemeral: true });
}

function interactionHandling() {
  client.on(Events.InteractionCreate, async interaction => {
    if (!('botData' in interaction.client)) return await respondError(interaction, "Kunnde inte ladda handlings information");
    if (interaction.isChatInputCommand()) {
      let botData = interaction.client.botData;
      if (!(typeof botData == "object" && botData != null && 'commands' in botData)) return await respondError(interaction, "Kunnde inte ladda kommandon");
      if (!(botData.commands instanceof Collection)) return await respondError(interaction, "Kunnde inte ladda kommandon");
      const command = botData.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await respondError(interaction, "Något gick fel med kommandot");
      }
    }
  })
}

function loadCommands() {
  const commandsPath = path.join(__dirname, 'compiled/commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
      client.botData.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

main()