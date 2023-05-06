import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { CustomClient } from './customClient';
import { serverVoteData } from './databaseActions';
import { generateSummary, getRole, voteCreateMessage, voteMessage } from './messageCreators';

export async function updateVotes(client: CustomClient) {
	const now = `${+new Date}`;


	const shouldStart = (await client.database.pool.execute(
		'SELECT * FROM guilds WHERE started = 0 AND ended = 0 AND start_time < ?',
		[now],
	))[0];

	const shouldEnd = (await client.database.pool.execute(
		'SELECT * FROM guilds WHERE started = 1 AND ended = 0 AND end_time < ?',
		[now],
	))[0];

	const logMessage = ['Updating votes'];

	if (Array.isArray(shouldStart)) {
		logMessage.push(`Starting: ${shouldStart.length}`);
	}

	if (Array.isArray(shouldEnd)) {
		logMessage.push(`Starting: ${shouldEnd.length}`);
	}

	client.logger.info(logMessage.join('. '));

	if (Array.isArray(shouldStart)) {
		for (let i = 0; i < shouldStart.length; i++) {

			const data = shouldStart[i];
			if (!('creation_time' in data)) continue;

			client.logger.info(`Starting ${data.guild_id}.${data.creation_time}`);

			startVote(client, data.guild_id, {
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
				start_time: data.start_time,
				end_time: data.end_time,
			});
		}
	}

	if (Array.isArray(shouldEnd)) {
		for (let i = 0; i < shouldEnd.length; i++) {
			const data = shouldEnd[i];
			if (!('creation_time' in data)) continue;

			client.logger.info(`Ending ${data.guild_id}.${data.creation_time}`);

			endVote(client, data.guild_id, {
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
				start_time: data.start_time,
				end_time: data.end_time,
			});
		}
	}
}

export async function startVote(client: CustomClient, guild_id: string, voteData: serverVoteData): Promise<boolean> {
	const messageChannel = await (await client.guilds.fetch(guild_id)).channels.fetch(voteData.channel_id);

	if (!(messageChannel.isTextBased() && messageChannel.permissionsFor(client.user).has(PermissionsBitField.Flags.SendMessages))) {
		return false;
	}

	const choices = await client.customData.choices.getChoices(client.database, guild_id, voteData.creation_time);

	if (choices.length < 2) {
		return false;
	}

	voteData.start_time = `${new Date().getTime()}`;

	const info_message = await messageChannel.send({
		...await voteMessage(client, guild_id, voteData, choices, false, generateSummary(choices, [])),
		content: voteData.mention_role_id !== null ? `${await getRole(client, guild_id, voteData.mention_role_id)}` : '',
	});

	await client.customData.votes.updateProperty(client.database, guild_id, voteData.creation_time, 'started', true);
	await client.customData.votes.updateProperty(client.database, guild_id, voteData.creation_time, 'start_time', voteData.start_time);
	await client.customData.votes.updateProperty(client.database, guild_id, voteData.creation_time, 'message_id', info_message.id);

	const newData = await client.customData.votes.getFull(client.database, guild_id, voteData.creation_time);
	const infoMessageChannel = await (await client.guilds.fetch(guild_id)).channels.fetch(newData.status_message_channel_id);

	if (!infoMessageChannel.isTextBased()) {
		client.logger.warn(`Info message channel ${newData.status_message_channel_id} is not text based for vote ${guild_id}.${voteData.creation_time}`);
		return false;
	}

	const infoMessage = await infoMessageChannel.messages.fetch(newData.status_message_id);

	if (!infoMessage) {
		client.logger.warn(`Info message ${newData.status_message_channel_id}.${newData.status_message_id} does not exist for vote ${guild_id}.${voteData.creation_time}`);
		return false;
	}

	await infoMessage.edit(await voteCreateMessage(client, guild_id, newData, choices, false));

	return true;
}

export async function endVote(client: CustomClient, guild_id: string, voteData: serverVoteData): Promise<boolean> {
	const messageChannel = await (await client.guilds.fetch(guild_id)).channels.fetch(voteData.channel_id);

	if (!(messageChannel.isTextBased() && messageChannel.permissionsFor(client.user).has(PermissionsBitField.Flags.SendMessages))) {
		return false;
	}

	const votes = await client.customData.voteData.getVotes(client.database, guild_id, voteData.creation_time);
	let true_votes = votes;

	if (votes === undefined) {
		true_votes = [];
	}

	voteData.end_time = `${new Date().getTime()}`;

	await client.customData.votes.updateProperty(client.database, guild_id, voteData.creation_time, 'ended', true);
	await client.customData.votes.updateProperty(client.database, guild_id, voteData.creation_time, 'end_time', voteData.end_time);

	const newData = await client.customData.votes.getFull(client.database, guild_id, voteData.creation_time);

	const choices = await client.customData.choices.getChoices(client.database, guild_id, voteData.creation_time);
	const summary = generateSummary(choices, true_votes);

	const info_message = await messageChannel.messages.fetch(voteData.message_id);
	await info_message.edit(await voteMessage(client, guild_id, newData, choices, true, summary));

	const sortedKeys = Object.keys(summary).sort((a, b) => summary[b] - summary[a]);

	const resultStrings = [];

	function getPlacement(array, index): number {
		for (let i = index; i > 0; i--) {
			if (array[i] < array[i - 1]) return i + 1;
		}

		return 1;
	}

	sortedKeys.forEach((key, index, array) => resultStrings.push(`**${getPlacement(array, index)}.** ${key}: ${summary[key]}`));

	const infoEmbed = new EmbedBuilder()
		.setTitle('Avslutad')
		.setDescription('Röstningen är nu avslutat och ni kan istället finna resultaten här under')
		.addFields({ name: 'Resultat', value: resultStrings.join('\n') })
		.setColor('Blurple');

	await info_message.reply({ embeds: [infoEmbed] });
	const infoMessageChannel = await (await client.guilds.fetch(guild_id)).channels.fetch(newData.status_message_channel_id);

	if (!infoMessageChannel.isTextBased()) {
		client.logger.warn(`Info message channel ${newData.status_message_channel_id} is not text based for vote ${guild_id}.${voteData.creation_time}`);
		return false;
	}

	const infoMessage = await infoMessageChannel.messages.fetch(newData.status_message_id);

	if (!infoMessage) {
		client.logger.warn(`Info message ${newData.status_message_channel_id}.${newData.status_message_id} does not exist for vote ${guild_id}.${voteData.creation_time}`);
		return false;
	}

	await infoMessage.edit(await voteCreateMessage(client, guild_id, newData, choices, false));

	return true;
}