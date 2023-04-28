import { SlashCommandBuilder, EmbedBuilder, Events } from 'discord.js';
import { CommandData, CustomCommandInteraction } from '../customClient';
import * as util from 'util';
import idAutocorrect, { getAll } from '../idAutocorrect';

module.exports = new CommandData(
	new SlashCommandBuilder()
		.setName('delete-vote')
		.setDescription('Deletes all data for a vote from the database')
		.setNameLocalization('sv-SE', 'radera-röstning')
		.setDescriptionLocalization('sv-SE', 'Raderar all data om en röstning från databasen')
		.setDefaultMemberPermissions('0')
		.addStringOption(option => option
			.setName('vote-id')
			.setDescription('The id of the vote')
			.setNameLocalization('sv-SE', 'röstnings-id')
			.setDescriptionLocalization('sv-SE', 'Röstningens id')
			.setRequired(true)
			.setAutocomplete(true)),
	async function(interaction: CustomCommandInteraction) {
		const vote_id = interaction.options.getString('vote-id', true);
		const args = vote_id.split('.');

		const logger = interaction.client.logger;

		logger.info(`${interaction.user.tag} tried to delete vote ${vote_id}`);

		if (interaction.user.id != interaction.client.config.bot.ownerId) {
			const embed = new EmbedBuilder()
				.setTitle('Stop!')
				.setDescription('Du äger inte denna boten, så du kan inte ta bort saker från databasen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const embed = new EmbedBuilder()
			.setTitle('Röstningen är nu borta!')
			.setDescription('Alla meddelanden relaterade till röstningen borde också vara borta')
			.setColor('Blurple');

		await interaction.reply({ embeds: [embed], ephemeral: true });

		interaction.client.logger.info(`Deleted vote ${vote_id}`);

		const voteData = await interaction.client.customData.votes.getFull(interaction.client.database, args[0], args[1]);

		try {
			const channel = await interaction.client.channels.fetch(voteData.channel_id);
			if (channel.isTextBased()) {
				(await channel.messages.fetch(voteData.message_id)).delete();
			}
		}
		catch (err) {
			logger.warn('Could not delete main message');
		}

		try {
			const channel = await interaction.client.channels.fetch(voteData.status_message_channel_id);
			if (channel.isTextBased()) {
				(await channel.messages.fetch(voteData.status_message_id)).delete();
			}
		}
		catch (err) {
			logger.warn('Could not delete status message');
		}

		try {
			interaction.client.customData.voteData.data[args[0]][args[1]] = undefined;
		}
		catch (err) {
			logger.warn('Could not delete voteData');
		}

		try {
			interaction.client.customData.votes.data[args[0]] = interaction.client.customData.votes.data[args[0]].filter((value) => {
				return value.creation_time !== args[1];
			});
		}
		catch (err) {
			logger.warn('Could not delete main data');
		}

		try {
			interaction.client.customData.choices.data[args[0]][args[1]] = undefined;
		}
		catch (err) {
			logger.warn('Could not delete choices');
		}

		await interaction.client.database.pool.execute(
			'DELETE FROM guilds WHERE guild_id = ? AND creation_time = ?',
			[args[0], args[1]],
		);

		await interaction.client.database.pool.execute(
			'DELETE FROM votes WHERE guild_id = ? AND creation_time = ?',
			[args[0], args[1]],
		);

		await interaction.client.database.pool.execute(
			'DELETE FROM choices WHERE guild_id = ? AND creation_time = ?',
			[args[0], args[1]],
		);
	},
	idAutocorrect(getAll),
);