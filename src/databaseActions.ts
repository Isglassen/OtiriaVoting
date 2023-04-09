import * as mySQL from 'mysql2/promise';

export type serverVoteData = {
	name: string,
	description: string;
	channel_id: string,
	message_id: string,
	status_message_id: string,
	status_message_channel_id: string,
	creation_time: string,
	started: boolean,
	ended: boolean,
	can_vote_id: string,
	mention_role_id: string,
	live_result: boolean,
}

export type choiceData = {
	name: string,
	description: string
}

export class Choices {
	data : {
		[guild_id: string]: {
			[creation_time: string]: choiceData[]
		}
	} = {};

	async saveAll(database: BotDatabase) {
		// TODO
	}

	async getCache(database: BotDatabase, guild_id: string, creation_time: string) {
		if (this.data[guild_id] && Array.isArray(this.data[guild_id][creation_time])) return;
		console.log('Loading choices into cache');

		const choices = (await database.pool.execute(
			'SELECT * FROM choices WHERE guild_id = ? AND creation_time = ?',
			[guild_id, creation_time],
		))[0];

		if (!Array.isArray(choices)) return;

		if (!this.data[guild_id]) this.data[guild_id] = {};
		if (!Array.isArray(this.data[guild_id][creation_time])) this.data[guild_id][creation_time] = [];

		for (let i = 0; i < choices.length; i++) {
			const data = choices[i];
			if (!('creation_time' in data)) continue;

			this.data[data.guild_id][data.creation_time].push({
				name: data.name,
				description: data.description,
			});
		}
	}

	async removeChoice(database: BotDatabase, guild_id: string, creation_time: string, name: string) {
		// Fetch everything if it is not in the cache
		await this.getCache(database, guild_id, creation_time);

		if (!this.data[guild_id]) return;
		if (!Array.isArray(this.data[guild_id][creation_time])) return;

		let index = 0;
		for (let i = 0; i < this.data[guild_id][creation_time].length; i++) {
			if (this.data[guild_id][creation_time][i].name == name) {
				index = i;
				break;
			}
		}

		this.data[guild_id][creation_time].splice(index, 1);

		await database.pool.execute(
			'DELETE FROM choices WHERE guild_id = ? AND creation_time = ? AND name = ?',
			[guild_id, creation_time, name],
		);
	}

	async addChoice(database: BotDatabase, guild_id: string, creation_time: string, data: choiceData) {
		// Fetch everything if it is not in the cache
		await this.getCache(database, guild_id, creation_time);

		if (!this.data[guild_id]) this.data[guild_id] = {};
		if (!Array.isArray(this.data[guild_id][creation_time])) this.data[guild_id][creation_time] = [];

		if (this.data[guild_id][creation_time].some(val => val.name == data.name)) return;

		this.data[guild_id][creation_time].push(data);

		await database.pool.execute(
			'INSERT INTO choices (guild_id, creation_time, name, description) VALUES (?, ?, ?, ?)',
			[guild_id, creation_time, data.name, data.description],
		);

		console.log(JSON.stringify(this.data));
	}

	async getChoices(database: BotDatabase, guild_id: string, creation_time: string): Promise<choiceData[]> {
		// Fetch everything if it is not in the cache
		await this.getCache(database, guild_id, creation_time);

		if (!this.data[guild_id]) return [];
		if (!Array.isArray(this.data[guild_id][creation_time])) return [];

		return this.data[guild_id][creation_time];
	}
}

// BIGINT: string, VARCHAR: string, BOOLEAN: number, NULL: null
export class ServerVotes {
	data: {
		[guild_id: string]: serverVoteData[]
	} = {};

	async getCache(database: BotDatabase, guild_id: string, creation_time: string) {
		if (Array.isArray(this.data[guild_id]) && this.data[guild_id].some(val => val.creation_time == creation_time)) return;
		console.log('Loading guild into cache');

		const guild = (await database.pool.execute(
			'SELECT * FROM guilds WHERE guild_id = ? AND creation_time = ?',
			[guild_id, creation_time],
		))[0];

		if (!Array.isArray(guild)) return;

		if (!Array.isArray(this.data[guild_id])) this.data[guild_id] = [];

		for (let i = 0; i < guild.length; i++) {
			const data = guild[i];
			if (!('creation_time' in data)) continue;

			this.data[data.guild_id].push({
				name: data.name,
				description: data.description,
				channel_id: data.channel_id,
				message_id: data.message_id,
				status_message_id: data.status_message_id,
				status_message_channel_id: data.status_message_channel_id,
				creation_time: data.creation_time,
				started: !!data.started,
				ended: !!data.ended,
				can_vote_id: data.can_vote_id,
				mention_role_id: data.mention_role_id,
				live_result: !!data.live_result,
			});
		}
	}

	async getGuildCache(database: BotDatabase, guild_id: string) {
		// Get list of creation_times
		const all = (await database.pool.execute(
			'SELECT creation_time FROM guilds WHERE guild_id = ?',
			[guild_id],
		))[0];

		if (!Array.isArray(all)) return;

		// Run getCache for every time
		for (let i = 0; i < all.length; i++) {
			const data = all[i];
			if ('creation_time' in data) await this.getCache(database, guild_id, data.creation_time);
		}
	}

	async getAll(database: BotDatabase, guild_id: string): Promise<serverVoteData[]> {
		await this.getGuildCache(database, guild_id);

		if (!Array.isArray(this.data[guild_id])) return [];
		return this.data[guild_id];
	}

	async saveAll(database: BotDatabase) {
		// TODO
	}

	async createVote(database: BotDatabase, guild_id: string, voteData: serverVoteData) {
		if (!Array.isArray(this.data[guild_id])) this.data[guild_id] = [];
		this.data[guild_id].push(voteData);

		await database.pool.execute(
			'INSERT INTO guilds (name, description, channel_id, message_id, status_message_id, status_message_channel_id, creation_time, started, ended, can_vote_id, mention_role_id, guild_id, live_result) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
			[voteData.name, voteData.description, voteData.channel_id, voteData.message_id, voteData.status_message_id, voteData.status_message_channel_id, voteData.creation_time, voteData.started, voteData.ended, voteData.can_vote_id, voteData.mention_role_id, guild_id, voteData.live_result],
		);
	}

	async updateProperty<T extends keyof serverVoteData>(database: BotDatabase, guild_id: string, creation_time: string, property: T, value: serverVoteData[T]) {
		// Fetch everything if it is not in the cache
		await this.getCache(database, guild_id, creation_time);

		if (!Array.isArray(this.data[guild_id])) return;
		let updated = false;
		this.data[guild_id].forEach((vote, index) => {
			if (vote.creation_time != creation_time) return;
			updated = true;
			this.data[guild_id][index][property] = value;
		});

		if (!updated) return;

		await database.pool.execute(
			`UPDATE guilds SET ${property} = ?`,
			[value],
		);
	}

	async getProperty<T extends keyof serverVoteData>(database: BotDatabase, guild_id: string, creation_time: string, property: T): Promise<serverVoteData[T]> {
		// Fetch everything if it is not in the cache
		await this.getCache(database, guild_id, creation_time);

		const data = (await this.getFull(database, guild_id, creation_time));
		if (data === undefined) return undefined;
		return data[property];
	}

	async getFull(database: BotDatabase, guild_id: string, creation_time: string): Promise<serverVoteData> {
		// Fetch everything if it is not in the cache
		await this.getCache(database, guild_id, creation_time);

		if (!Array.isArray(this.data[guild_id])) return undefined;
		for (let i = 0; i < this.data[guild_id].length; i++) {
			if (this.data[guild_id][i].creation_time == creation_time) return this.data[guild_id][i];
		}
		return undefined;
	}
}

export type voteData = {
	user_id: string,
	voted_for: string
}

export class VoteDatas {
	data: {
		[guild_id: string]: {
			[creation_time: string]: voteData[];
		}
	} = {};

	async getCache(database: BotDatabase, guild_id: string, creation_time: string) {
		if (this.data[guild_id] && Array.isArray(this.data[guild_id][creation_time])) return;
		console.log('Loading votes into cache');

		const votes = (await database.pool.execute(
			'SELECT * FROM votes WHERE guild_id = ? AND creation_time = ?',
			[guild_id, creation_time],
		))[0];

		if (!Array.isArray(votes)) return;

		if (!this.data[guild_id]) this.data[guild_id] = {};
		if (!Array.isArray(this.data[guild_id][creation_time])) this.data[guild_id][creation_time] = [];

		for (let i = 0; i < votes.length; i++) {
			const data = votes[i];
			if (!('creation_time' in data)) continue;

			this.data[data.guild_id][data.creation_time].push({
				user_id: data.user_id,
				voted_for: data.choice,
			});
		}
	}

	async setVote(database: BotDatabase, guild_id: string, creation_time: string, user_id: string, vote: string) {
		// Fetch everything if it is not in the cache
		await this.getCache(database, guild_id, creation_time);

		if (!this.data[guild_id]) this.data[guild_id] = {};
		if (!Array.isArray(this.data[guild_id][creation_time])) this.data[guild_id][creation_time] = [];
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

		const currentVote = (await database.pool.execute(
			'SELECT choice FROM votes WHERE guild_id = ? AND creation_time = ? AND user_id = ?',
			[guild_id, creation_time, user_id],
		))[0];

		if (!Array.isArray(currentVote)) return;

		if (currentVote.length > 0) {
			await database.pool.execute(
				'UPDATE votes SET choice = ? WHERE guild_id = ? AND creation_time = ? AND user_id = ?',
				[vote, guild_id, creation_time, user_id],
			);
			return;
		}

		await database.pool.execute(
			'INSERT INTO votes (choice, guild_id, creation_time, user_id) VALUES (?, ?, ?, ?)',
			[vote, guild_id, creation_time, user_id],
		);
	}

	async getVote(database: BotDatabase, guild_id: string, creation_time: string, user_id: string): Promise<string> {
		// Fetch everything if it is not in the cache
		await this.getCache(database, guild_id, creation_time);

		if (!this.data[guild_id]) return undefined;
		if (!Array.isArray(this.data[guild_id][creation_time])) return undefined;
		for (let i = 0; i < this.data[guild_id][creation_time].length; i++) {
			if (this.data[guild_id][creation_time][i].user_id == user_id) return this.data[guild_id][creation_time][i].voted_for;
		}
		return undefined;
	}

	async getVotes(database: BotDatabase, guild_id: string, creation_time: string): Promise<{ user_id: string, voted_for: string }[]> {
		// Fetch everything if it is not in the cache
		await this.getCache(database, guild_id, creation_time);

		if (!this.data[guild_id]) return undefined;
		if (!Array.isArray(this.data[guild_id][creation_time])) return undefined;
		return this.data[guild_id][creation_time];
	}

	async saveAll(database: BotDatabase) {
		// TODO
	}
}

export class DatabaseData {
	choices: Choices = new Choices();
	votes: ServerVotes = new ServerVotes();
	voteData: VoteDatas = new VoteDatas();

	async saveAll(database: BotDatabase) {
		await Promise.all([
			this.choices.saveAll(database),
			this.votes.saveAll(database),
			this.voteData.saveAll(database),
		]);
	}
}

export default class BotDatabase {
	public database: mySQL.ConnectionConfig;
	public pool: mySQL.Pool;

	private canConnect: boolean = false;
	private connected: boolean = false;

	constructor(database: mySQL.ConnectionConfig) {
		this.database = database;
	}

	async createConnection() {
		if (this.canConnect) return;
		this.pool = await mySQL.createPool({
			...this.database,
			supportBigNumbers: true,
			bigNumberStrings: true,

		});
	}

	async end() {
		if (!this.connected || !this.canConnect) return;
		this.connected = false;
		return await this.pool.end();
	}

	async saveAll(data: DatabaseData) {
		await data.saveAll(this);
	}
}