import { ButtonInteraction, ChatInputCommandInteraction, Client, ClientOptions, Collection, Interaction, ModalSubmitInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import BotDatabase, { DatabaseData } from './databaseActions';
import * as mySQL from 'mysql';

type GeneralCommandBuilder =
  | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
  | SlashCommandSubcommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandGroupBuilder
  | SlashCommandSubcommandsOnlyBuilder

export class CommandData {
  data: GeneralCommandBuilder;
  execute: (interaction: CustomCommandInteraction) => Promise<void>;
  constructor(data: GeneralCommandBuilder, execute: (interaction: CustomCommandInteraction) => Promise<void>) {
    this.data = data;
    this.execute = execute;
  }
}

export class ButtonData {
  name: string;
  execute: (interaction: CustomButtomInteraction) => Promise<void>;
  constructor(name: string, execute: (interaction: CustomButtomInteraction) => Promise<void>) {
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
  customData: DatabaseData = new DatabaseData();
  botData: { commands: Collection<string, CommandData>, buttons: Collection<string, ButtonData> };
  config: BotConfig

  constructor(options: ClientOptions, config: BotConfig) {
    super(options);

    this.config = config;
    this.database = new BotDatabase(config.database);
    this.botData = { commands: new Collection, buttons: new Collection }
  }
}

export type CustomInteraction = Interaction & {
  client: CustomClient;
}

export type CustomButtomInteraction =
  & CustomInteraction
  & ButtonInteraction

export type CustomCommandInteraction =
  & CustomInteraction
  & ChatInputCommandInteraction

export type CustomModalInteraction =
  & CustomInteraction
  & ModalSubmitInteraction