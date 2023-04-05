import * as mySQL from 'mysql';
import * as util from 'util';

export type serverVoteData = {
  name: string,
	description: string;
  channel_id: string,
  message_id?: string,
  status_message_id: string,
  status_message_channel_id: string,
  creation_time: number,
  candidates: { name: string, description: string }[],
  started: boolean,
  ended: boolean,
  can_vote_id?: string,
  mention_role_id?: string
}

export class ServerVotes {
	data: {
    [guild_id: string]: serverVoteData[]
  } = {};

	async getAll(database: BotDatabase, guild_id: string): Promise<serverVoteData[]> {
		// TODO: Fetch other command data first
		if (!Array.isArray(this.data[guild_id])) return [];
		return this.data[guild_id];
	}

	async saveAll(database: BotDatabase) {
		// TODO
	}

	async createVote(database: BotDatabase, guild_id: string, voteData: serverVoteData) {
		if (!Array.isArray(this.data[guild_id])) this.data[guild_id] = [];
		this.data[guild_id].push(voteData);
		// TODO: Update database
	}

	async updateProperty<T extends keyof serverVoteData>(database: BotDatabase, guild_id: string, creation_time: number, property: T, value: serverVoteData[T]) {
		if (!Array.isArray(this.data[guild_id])) return;
		this.data[guild_id].forEach((vote, index) => {
			if (vote.creation_time != creation_time) return;
			this.data[guild_id][index][property] = value;
		});
		// TODO: Update database
	}

	async getProperty<T extends keyof serverVoteData>(database: BotDatabase, guild_id: string, creation_time: number, property: T): Promise<serverVoteData[T]> {
		// TODO: Fetch if not in cache
		const data = (await this.getFull(database, guild_id, creation_time));
		if (data == null) return null;
		return data[property];
	}

	async getFull(database: BotDatabase, guild_id: string, creation_time: number): Promise<serverVoteData> {
		// TODO: Fetch if not in cache
		if (!Array.isArray(this.data[guild_id])) return null;
		for (let i = 0; i < this.data[guild_id].length; i++) {
			if (this.data[guild_id][i].creation_time == creation_time) return this.data[guild_id][i];
		}
		return null;
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
		// TODO
	}
}

export class DatabaseData {
	votes: ServerVotes = new ServerVotes();
	voteData: VoteDatas = new VoteDatas();

	async saveAll(database: BotDatabase) {
		await Promise.all([
			this.votes.saveAll(database),
			this.voteData.saveAll(database),
		]);
	}
}

export default class BotDatabase {
	public database: mySQL.ConnectionConfig;
	private connection: mySQL.Connection;

	public query: (query: string) => Promise<any>;
	public connect: () => Promise<void>;
	public end: () => Promise<void>;

	constructor(database: mySQL.ConnectionConfig) {
		this.database = database;
		this.connection = mySQL.createConnection(database);

		this.query = util.promisify(this.connection.query).bind(this.connection);
		this.connect = util.promisify(this.connection.connect).bind(this.connection);
		this.end = util.promisify(this.connection.end).bind(this.connection);
	}

	async saveAll(data: DatabaseData) {
		await data.saveAll(this);
	}
}