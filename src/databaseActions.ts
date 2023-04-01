import * as mySQL from "mysql";
import * as util from "util";

export class ServerConfigs {
  data: {
    guild_id: string,
    announcement_id: string,
    log_id: string,
    can_vote_id: string,
    mention_role_id: string
  }[] = [];

  async saveAll(database: BotDatabase) {

  }
}

export type serverVoteData = {
  name: string,
  channel_id?: string,
  message_id?: string,
  create_message_id: string,
  create_message_channel_id: string,
  creation_time: number,
  candidates: string[],
  started: boolean,
  ended: boolean
}

export class ServerVotes {
  data: {
    [guild_id: string]: serverVoteData[]
  } = {};

  async saveAll(database: BotDatabase) {

  }

  async createVote(database: BotDatabase, guild_id, voteData: serverVoteData) {
    // TODO: Fetch other command data first
    let votesArray = this.data[guild_id]
    if (!Array.isArray(votesArray)) votesArray = []
    votesArray.push(voteData);
  }
}

export class VoteDatas {
  data: {
    [guild_id: string]: {
      [creation_time: string]: {
        user_id: string,
        voted_for: string
      }[]
    }
  } = {};

  async saveAll(database: BotDatabase) {

  }
}

export class DatabaseData {
  config: ServerConfigs = new ServerConfigs();
  votes: ServerVotes = new ServerVotes();
  voteData: VoteDatas = new VoteDatas();

  async saveAll(database: BotDatabase) {
    await Promise.all([
      this.config.saveAll(database),
      this.votes.saveAll(database),
      this.voteData.saveAll(database)
    ]);
  }
}

export default class BotDatabase {
  private database: mySQL.ConnectionConfig
  private connection: mySQL.Connection

  private query: (query: string) => Promise<any>;
  public connect: Promise<void>;
  public end: () => Promise<void>;

  constructor(database: mySQL.ConnectionConfig) {
    this.database = database;
    this.connection = mySQL.createConnection(database)

    this.query = util.promisify(this.connection.query).bind(this.connection);
    this.connect = util.promisify(this.connection.connect).bind(this.connection);
    this.end = util.promisify(this.connection.end).bind(this.connection);
  }

  async saveAll(data: DatabaseData) {
    await data.saveAll(this)
  }

  async firstData() {
    let tables = await this.query("SHOW TABLES LIKE 'config'");
    if (tables.length > 0) return;

    console.log("Creating config table");
    await this.query("CREATE TABLE config (`guild_id` BIGINT UNSIGNED NOT NULL, `announcement_id` BIGINT UNSIGNED NOT NULL, `log_id` BIGINT UNSIGNED NOT NULL, `can_vote_id` BIGINT UNSIGNED NULL DEFAULT NULL, `mention_role_id` BIGINT UNSIGNED NULL DEFAULT NULL)")
  }

  async checkGuildVotes(guild_id: string) {
    // Check if votes_${guild_id} exists
    // Create if missing
  }
}