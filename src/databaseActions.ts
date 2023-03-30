import * as mySQL from "mysql";
import * as util from "util";

export class DatabaseData {
  votes: {name: string, time: number, candidates: string[]}[] = []
  
  constructor() {}
}

export default class BotDatabase {
  private database: mySQL.ConnectionConfig
  private connection: mySQL.Connection

  private query;
  public connect;
  public end;

  constructor(database: mySQL.ConnectionConfig) {
    this.database = database;
    this.connection = mySQL.createConnection(database)

    this.query = util.promisify(this.connection.query).bind(this.connection);
    this.connect = util.promisify(this.connection.connect).bind(this.connection);
    this.end = util.promisify(this.connection.end).bind(this.connection);
  }

  async saveAll(data: DatabaseData) {

  }

  async firstData() {
    let tables = await this.query("SHOW TABLES LIKE 'config'");
    if (tables.length > 0) return; 

    console.log("Creating config table");
    await this.query("CREATE TABLE config (`guild_id` BIGINT UNSIGNED NOT NULL, `announcement_id` BIGINT UNSIGNED NOT NULL, `log_id` BIGINT UNSIGNED NOT NULL, `can_vote_id` BIGINT UNSIGNED NULL DEFAULT NULL)")
  }
}