const { GatewayIntentBits, Events, EmbedBuilder, Collection, InteractionType, ComponentType } = require('discord.js');
const { CustomClient } = require('./compiled/customClient.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./compiled/bot-config.json');

const client = new CustomClient({ intents: [GatewayIntentBits.Guilds] }, config);

// TODO: Not ephemeral versions of some commands
// TODO: Custom error for when the bot tries to edit responses without message perms
// TODO: Optimize code order in many files to only do things right before when they are needed

async function main() {
	loadCommands();
	loadButtons();
	loadSelectMenus();

	await client.database.createConnection();
	await client.database.connect();

	interactionHandling();

	client.once(Events.ClientReady, () => {
		if (client.user) console.log(`Ready! Logged in as ${client.user.tag}`);
	});

	if ('bot' in config && typeof config.bot == 'object' && config.bot !== null && 'token' in config.bot && typeof config.bot.token == 'string') { client.login(config.bot.token); }
	else {
		console.error('config.bot.token was missing');
		await client.database.end();
		client.database.destroy();
		process.exit();
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
	if (!interaction.isRepliable()) return false;
	if (!(interaction.replied || interaction.deferred)) {
		await interaction.reply({ embeds: [embed], ephemeral: true });
		return false;
	}
	await interaction.followUp({ embeds: [embed], ephemeral: true });
	return false;
}

function interactionHandling() {
	client.on(Events.InteractionCreate, async interaction => {
		console.log(`${InteractionType[interaction.type]} interaction from ${interaction.user.tag} at ${new Date().toUTCString()}`);

		/**
		 * @type {import("./src/customClient").CustomInteraction}
		 */
		// @ts-ignore
		const customInteraction = interaction;
		if (customInteraction.isChatInputCommand()) return await commandHandling(customInteraction);
		if (customInteraction.isButton()) return await buttonHandling(customInteraction);
		if (customInteraction.isAutocomplete()) return await autocompleteHandling(customInteraction);
		if (customInteraction.isAnySelectMenu()) return await selectMenuHandling(customInteraction);
	});
}

/**
 * @param {import('./src/customClient').CustomSelectMenuInteraction} interaction
 */
async function selectMenuHandling(interaction) {
	const botData = interaction.client.botData;
	const selectMenuName = interaction.customId.split('.')[0];
	const selectMenu = botData.selectMenus.get(selectMenuName);

	if (!selectMenu) {
		console.error(`No select menu matching ${selectMenuName}`);
		return;
	}

	if (selectMenu.type != interaction.componentType) {
		console.error(`Select menu ${selectMenuName} does uses ${ComponentType[selectMenu.type]}, not ${ComponentType[interaction.componentType]}`);
		return;
	}

	try {
		await selectMenu.execute(interaction);
	}
	catch (error) {
		console.error(error);
		await respondError(interaction, 'Något gick fel med menyn');
	}
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

function loadSelectMenus() {
	const selectMenusPath = path.join(__dirname, 'compiled/selectMenus');
	const selectMenuFiles = fs.readdirSync(selectMenusPath).filter(file => file.endsWith('.js'));

	for (const file of selectMenuFiles) {
		const filePath = path.join(selectMenusPath, file);
		const selectMenu = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('name' in selectMenu && 'execute' in selectMenu && 'type' in selectMenu) {
			client.botData.selectMenus.set(selectMenu.name, selectMenu);
		}
		else {
			console.log(`[WARNING] The selectMenu at ${filePath} is missing a required "name", "type" or "execute" property.`);
		}
	}
}

main();