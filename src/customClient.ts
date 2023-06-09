import { ActivityType, AnySelectMenuInteraction, AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, Client, ClientOptions, Collection, Events, Interaction, ModalSubmitInteraction, SelectMenuType, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import BotDatabase, { DatabaseData } from './databaseActions';
import * as mySQL from 'mysql2/promise';
import * as winston from 'winston';
import { updateVotes } from './automaticActions';

type GeneralCommandBuilder =
  | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  | SlashCommandSubcommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandGroupBuilder
  | SlashCommandSubcommandsOnlyBuilder

export class CommandData {
	data: GeneralCommandBuilder;
	execute: (interaction: CustomCommandInteraction) => Promise<void>;
	autocomplete?: (interaction: CustomAutocompleteInteraction) => Promise<void>;
	constructor(data: GeneralCommandBuilder,
		execute: (interaction: CustomCommandInteraction) => Promise<void>,
		autocomplete?: (interaction: CustomAutocompleteInteraction)=> Promise<void>) {
		this.data = data;
		this.execute = execute;
		this.autocomplete = autocomplete;
	}
}

export class SelectMenuData {
	name: string;
	type: SelectMenuType;
	execute: (interaction: CustomSelectMenuInteraction) => Promise<void>;
	constructor(name: string, type: SelectMenuType, execute: (interaction: CustomSelectMenuInteraction) => Promise<void>) {
		this.name = name;
		this.type = type;
		this.execute = execute;
	}
}

export class ButtonData {
	name: string;
	execute: (interaction: CustomButtonInteraction) => Promise<void>;
	constructor(name: string, execute: (interaction: CustomButtonInteraction) => Promise<void>) {
		this.name = name;
		this.execute = execute;
	}
}

export type BotConfig = {
  bot: {
    token: string,
    ownerId: string,
    guildId: string,
    clientId: string
  },
  database: mySQL.ConnectionConfig
}

export class CustomClient extends Client {
	database: BotDatabase;
	customData: DatabaseData;
	botData: { commands: Collection<string, CommandData>, buttons: Collection<string, ButtonData>, selectMenus: Collection<string, SelectMenuData>, interactionHandler: (interaction: Interaction) => Promise<void> };
	config: BotConfig;
	logger: winston.Logger;
	updateTask: NodeJS.Timer;

	constructor(options: ClientOptions, config: BotConfig, logger: winston.Logger, interactionHandler: (interaction: Interaction) => Promise<void>) {
		super(options);

		this.logger = logger;
		this.customData = new DatabaseData(this.logger);

		this.on(Events.InteractionCreate, interactionHandler);

		this.config = config;
		this.database = new BotDatabase(config.database);
		this.botData = { commands: new Collection, buttons: new Collection, selectMenus: new Collection, interactionHandler: interactionHandler };
	}

	public override destroy(): void {
		clearInterval(this.updateTask);
		super.destroy();
	}

	startUpdates(packageData: { version: string }) {
		const time = new Date;
		time.setMinutes(time.getMinutes() + 10);
		time.setSeconds(0);
		time.setMilliseconds(0);

		const timeString: string = (`${time.getUTCHours()}`.length < 2 ? '0' + time.getUTCHours() : `${time.getUTCHours()}`) +
		':' + (`${time.getUTCMinutes()}`.length < 2 ? '0' + time.getUTCMinutes() : `${time.getUTCMinutes()}`);

		this.user.setPresence({
			status: 'idle',
			activities: [{
				name: `Startat om. Kör automatiska kommandon ${timeString} UTC`,
				type:  ActivityType.Playing,
			}],
		});

		setTimeout(() => {
			updateVotes(this);
			this.updateTask = setInterval(updateVotes, 30_000, this);

			this.user.setPresence({
				status: 'online',
				activities: [{
					name: `Version ${packageData.version}`,
					type:  ActivityType.Playing,
				}],
			});

			setInterval(() => {
				if (!this.user) return;

				this.user.setPresence({
					status: 'online',
					activities: [{
						name: `Version ${packageData.version}`,
						type:  ActivityType.Playing,
					}],
				});
			}, 600_000);
		}, +time - +new Date);
	}
}

export type CustomInteraction = Interaction & {
	client: CustomClient;
}

export type CustomButtonInteraction =
  & CustomInteraction
  & ButtonInteraction

export type CustomCommandInteraction =
  & CustomInteraction
  & ChatInputCommandInteraction

export type CustomModalInteraction =
  & CustomInteraction
  & ModalSubmitInteraction

export type CustomAutocompleteInteraction =
	& CustomInteraction
	& AutocompleteInteraction

export type CustomSelectMenuInteraction =
	& CustomInteraction
	& AnySelectMenuInteraction