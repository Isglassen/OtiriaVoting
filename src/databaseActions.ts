import * as mySQL from 'mysql2/promise';

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
      [creation_time: number]: {
        user_id: string,
        voted_for: string
      }[]
    }
  } = {};

	async setVote(database: BotDatabase, guild_id: string, creation_time: number, user_id: string, vote: string) {
		if (!this.data[guild_id]) this.data[guild_id] = {};
		if (!this.data[guild_id][creation_time]) this.data[guild_id][creation_time] = [];
		let found = false;
		for (let i = 0; i < this.data[guild_id][creation_time].length; i++) {
			if (this.data[guild_id][creation_time][i].user_id == user_id) {
				found = true;
				this.data[guild_id][creation_time][i].voted_for = vote;
				break;
			}
		}
		if (!found) {
			this.data[guild_id][creation_time].push({ user_id, voted_for: vote });
		}
		// TODO: Update database
	}

	async getVote(database: BotDatabase, guild_id: string, creation_time: number, user_id: string): Promise<string> {
		// TODO: Fetch if not in cache
		if (!this.data[guild_id]) return null;
		if (!this.data[guild_id][creation_time]) return null;
		for (let i = 0; i < this.data[guild_id][creation_time].length; i++) {
			if (this.data[guild_id][creation_time][i].user_id == user_id) return this.data[guild_id][creation_time][i].voted_for;
		}
		return null;
	}

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

	private canConnect: boolean = false;
	private connected: boolean = false;

	constructor(database: mySQL.ConnectionConfig) {
		this.database = database;
	}

	async createConnection() {
		if (this.canConnect) return;
		this.connection = await mySQL.createConnection(this.database);
	}

	async connect() {
		if (this.connected || !this.canConnect) return;
		this.connected = true;
		return await this.connection.connect();
	}

	async end() {
		if (!this.connected || !this.canConnect) return;
		this.connected = false;
		return await this.connection.end();
	}

	async saveAll(data: DatabaseData) {
		await data.saveAll(this);
	}
}