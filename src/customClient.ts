import { Client, ClientOptions, CommandInteraction } from 'discord.js';
import BotDatabase, { DatabaseData } from './databaseActions';
import * as mySQL from 'mysql';

export class CustomClient extends Client {
  database: BotDatabase
  customData: DatabaseData = new DatabaseData()

  constructor(options: ClientOptions, databaseConfig: mySQL.ConnectionConfig) {
    super(options);

    this.database = new BotDatabase(databaseConfig);
  }
}

export interface CustomCommandInteraction extends CommandInteraction {
  client: CustomClient
}