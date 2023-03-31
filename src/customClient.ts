import { Client, ClientOptions, Collection, CommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import BotDatabase, { DatabaseData } from './databaseActions';
import * as mySQL from 'mysql';

type GeneralCommandBuilder =
  | SlashCommandBuilder
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
  botData: { commands: Collection<string, CommandData> };
  config: BotConfig

  constructor(options: ClientOptions, config: BotConfig) {
    super(options);

    this.config = config;
    this.database = new BotDatabase(config.database);
    this.botData = { commands: new Collection }
  }
}

export interface CustomCommandInteraction extends CommandInteraction {
  client: CustomClient
}