const { GatewayIntentBits, Events, EmbedBuilder, Collection, InteractionType, ComponentType, ActivityType } = require('discord.js');
const { CustomClient } = require('./compiled/customClient.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./bot-config.json');
const packageData = require('./package.json');
const util = require('node:util');
const winston = require('winston');

const logger = winston.createLogger({
	format: winston.format.simple(),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: 'combined.log' }),
		new winston.transports.File({ filename: 'error.log', level: 'error', format: winston.format.combine(
			winston.format.errors({ stack: true }),
			winston.format.simple()),
		}),
	],
});

const client = new CustomClient({ intents: [GatewayIntentBits.Guilds] }, config, logger, interactionHandling);

// TODO: Defer replies
// TODO: Not ephemeral versions of some commands
// TODO: Somehow run the clean shutdown when running the stop on the host
// TODO: Create a new vote status message if the current message is not found. Maybe do this to all votes on startup
// TODO: Clear votes from the cache after some time

// Clean shutdown
if (process.platform === 'win32') {
	const rl = require('readline').createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.on('SIGINT', function() {
		process.emit('SIGINT');
	});
}

process.on('SIGINT', async function() {
	client.off(Events.InteractionCreate, client.botData.interactionHandler);

	logger.info('Letting discord finish in 1 second');
	await util.promisify(setTimeout)(1_000);
	client.destroy();

	logger.info('Logged out of discord. Waiting 5 seconds for database to finish');
	await util.promisify(setTimeout)(5_000);
	client.database.end();

	logger.info('Disconnecting from database. Exiting in 2.5 seconds');
	setTimeout(process.exit, 2_500);
});

process.on('exit', () => {
	client.destroy();
	client.database.end();
});

async function main() {
	loadCommands();
	loadButtons();
	loadSelectMenus();

	await client.database.createConnection();

	client.once(Events.ClientReady, () => {
		if (!client.user) return;

		logger.info(`Ready! Logged in as ${client.user.tag} at ${new Date().toUTCString()}`);

		client.user.setPresence({
			status: 'online',
			activities: [{
				name: `Version ${packageData.version}`,
				type:  ActivityType.Playing,
			}],
		});

		setInterval(() => {
			if (!client.user) return;

			client.user.setPresence({
				status: 'online',
				activities: [{
					name: `Version ${packageData.version}`,
					type:  ActivityType.Playing,
				}],
			});
		}, 600_000);
	});

	if ('bot' in config && typeof config.bot == 'object' && config.bot !== null && 'token' in config.bot && typeof config.bot.token == 'string') { client.login(config.bot.token); }
	else {
		logger.error('config.bot.token was missing');
		await client.database.end();
		setTimeout(process.exit, 2500);
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

async function interactionHandling(interaction) {
	logger.info(`${InteractionType[interaction.type]} interaction from ${interaction.user.tag} at ${new Date().toUTCString()}`);

	/**
		 * @type {import("./src/customClient").CustomInteraction}
		 */
	// @ts-ignore
	const customInteraction = interaction;
	if (customInteraction.isChatInputCommand()) return await commandHandling(customInteraction);
	if (customInteraction.isButton()) return await buttonHandling(customInteraction);
	if (customInteraction.isAutocomplete()) return await autocompleteHandling(customInteraction);
	if (customInteraction.isAnySelectMenu()) return await selectMenuHandling(customInteraction);
}

/**
 * @param {import('./src/customClient').CustomSelectMenuInteraction} interaction
 */
async function selectMenuHandling(interaction) {
	const botData = interaction.client.botData;
	const selectMenuName = interaction.customId.split('.')[0];
	const selectMenu = botData.selectMenus.get(selectMenuName);

	if (!selectMenu) {
		logger.error(`No select menu matching ${selectMenuName}`);
		return;
	}

	if (selectMenu.type != interaction.componentType) {
		logger.error(`Select menu ${selectMenuName} does uses ${ComponentType[selectMenu.type]}, not ${ComponentType[interaction.componentType]}`);
		return;
	}

	try {
		await selectMenu.execute(interaction);
	}
	catch (error) {
		logger.error(error);
		try {
			await respondError(interaction, 'Något gick fel med menyn');
		}
		catch (err) {
			logger.warn('Couldn\'t respond to error');
		}
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
		logger.error(`No button matching ${buttonName}`);
		return;
	}

	try {
		await button.execute(interaction);
	}
	catch (error) {
		logger.error(error);
		try {
			await respondError(interaction, 'Något gick fel med knappen');
		}
		catch (err) {
			logger.warn('Couldn\'t respond to error');
		}
	}
}

/**
 * @param {import('./src/customClient').CustomCommandInteraction} interaction
 */
async function commandHandling(interaction) {
	const botData = interaction.client.botData;
	const command = botData.commands.get(interaction.commandName);

	if (!command) {
		logger.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	}
	catch (error) {
		logger.error(error);
		try {
			await respondError(interaction, 'Något gick fel med kommandot');
		}
		catch (err) {
			logger.warn('Couldn\'t respond to error');
		}
	}
}

/**
 * @param {import('./src/customClient.js').CustomAutocompleteInteraction} interaction
 */
async function autocompleteHandling(interaction) {
	const botData = interaction.client.botData;
	const command = botData.commands.get(interaction.commandName);

	if (!command) {
		logger.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	if (!command.autocomplete) {
		logger.error(`Command ${interaction.commandName} has no autocomplete function`);
		return;
	}

	try {
		await command.autocomplete(interaction);
	}
	catch (error) {
		logger.error(error);
		try {
			await interaction.respond([]);
		}
		catch (err) {
			logger.warn('Couldn\'t respond to error');
		}
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
			logger.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
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
			logger.warn(`[WARNING] The button at ${filePath} is missing a required "name" or "execute" property.`);
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
			logger.warn(`[WARNING] The selectMenu at ${filePath} is missing a required "name", "type" or "execute" property.`);
		}
	}
}

main();