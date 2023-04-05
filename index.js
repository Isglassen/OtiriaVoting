const { GatewayIntentBits, Events, EmbedBuilder, Collection, InteractionType } = require('discord.js');
const { CustomClient } = require('./compiled/customClient.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./compiled/bot-config.json');

const client = new CustomClient({ intents: [GatewayIntentBits.Guilds] }, config);

async function main() {
	loadCommands();
	loadButtons();

	await client.database.connect();

	interactionHandling();

	client.once(Events.ClientReady, () => {
		if (client.user) console.log(`Ready! Logged in as ${client.user.tag}`);
	});

	if ('bot' in config && typeof config.bot == 'object' && config.bot != null && 'token' in config.bot && typeof config.bot.token == 'string') { client.login(config.bot.token); }
	else {
		console.error('config.bot.token was missing');
		await client.database.end();
	}
}


/**
 * @param {import("discord.js").Interaction<import("discord.js").CacheType>} interaction
 * @param {string | null} message
 */
async function respondError(interaction, message) {
	const embed = new EmbedBuilder()
		.setTitle('Handling misslyckades')
		.setDescription(message)
		.setColor('Red');
	if (!interaction.isRepliable()) return;
	if (!(interaction.replied || interaction.deferred)) {
		await interaction.reply({ embeds: [embed], ephemeral: true });
		return;
	}
	await interaction.followUp({ embeds: [embed], ephemeral: true });
}

function interactionHandling() {
	client.on(Events.InteractionCreate, async interaction => {
		console.log(`${InteractionType[interaction.type]} interaction from ${interaction.user.tag} at ${new Date().toUTCString()}`);
		if (!('botData' in interaction.client)) return await respondError(interaction, 'Kunnde inte ladda handlings information');
		const botData = interaction.client.botData;
		if (!(typeof botData == 'object' && botData != null && 'commands' in botData)) return await respondError(interaction, 'Kunnde inte ladda kommandon');
		if (!(botData.commands instanceof Collection)) return await respondError(interaction, 'Kunnde inte ladda kommandon');
		/**
		 * @type {import("./src/customClient").CustomInteraction}
		 */
		// @ts-ignore
		const customInteraction = interaction;
		// @ts-ignore
		if (interaction.isChatInputCommand()) return await commandHandling(customInteraction);
		// @ts-ignore
		if (interaction.isButton()) return await buttonHandling(customInteraction);
		// @ts-ignore
		if (interaction.isAutocomplete()) return await autocompleteHandling(customInteraction);
	});
}

/**
 * @param {import('./src/customClient').CustomButtomInteraction} interaction
 */
async function buttonHandling(interaction) {
	const botData = interaction.client.botData;
	const buttonName = interaction.customId.split('.')[0];
	const button = botData.buttons.get(buttonName);

	if (!button) {
		console.error(`No button matching ${buttonName}`);
		return;
	}

	try {
		await button.execute(interaction);
	}
	catch (error) {
		console.error(error);
		await respondError(interaction, 'Något gick fel med knappen');
	}
}

/**
 * @param {import('./src/customClient').CustomCommandInteraction} interaction
 */
async function commandHandling(interaction) {
	const botData = interaction.client.botData;
	const command = botData.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		await respondError(interaction, 'Något gick fel med kommandot');
	}
}

/**
 * @param {import('./src/customClient.js').CustomAutocompleteInteraction} interaction
 */
async function autocompleteHandling(interaction) {
	const botData = interaction.client.botData;
	const command = botData.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		if (command.autocomplete) {
			await command.autocomplete(interaction);
		}
	}
	catch (error) {
		console.error(error);
		await interaction.respond([]);
	}
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
		}
		else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

function loadButtons() {
	const buttonsPath = path.join(__dirname, 'compiled/buttons');
	const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));

	for (const file of buttonFiles) {
		const filePath = path.join(buttonsPath, file);
		const button = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('name' in button && 'execute' in button) {
			client.botData.buttons.set(button.name, button);
		}
		else {
			console.log(`[WARNING] The button at ${filePath} is missing a required "name" or "execute" property.`);
		}
	}
}

main();