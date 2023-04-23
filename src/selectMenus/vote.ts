import { ComponentType, EmbedBuilder } from 'discord.js';
import { CustomSelectMenuInteraction, SelectMenuData } from '../customClient';
import { generateSummary, voteMessage } from '../messageCreators';

module.exports = new SelectMenuData(
	'vote',
	ComponentType.StringSelect,
	async function(interaction: CustomSelectMenuInteraction) {
		if (!interaction.isStringSelectMenu()) return;

		const args = interaction.customId.split('.');

		const logger = interaction.client.logger;

		logger.info(`${interaction.user.tag} tried to vote for ${args[1]}.${args[2]}`);

		const voteData = await interaction.client.customData.votes.getFull(interaction.client.database, args[1], args[2]);

		if (voteData === undefined) {
			logger.info(`${interaction.user.tag} failed to vote for ${args[1]}.${args[2]} because the vote is not in the database`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kunnde inte hitta röstningen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const can_vote_id = voteData.can_vote_id;

		if (
			(Array.isArray(interaction.member.roles) && !interaction.member.roles.includes(can_vote_id))
			|| (!Array.isArray(interaction.member.roles)) && !interaction.member.roles.cache.some(role => role.id == can_vote_id)
		) {
			logger.info(`${interaction.user.tag} failed to vote for ${args[1]}.${args[2]} because they did not have permissions`);
			const embed = new EmbedBuilder()
				.setTitle('Ingen rösträtt')
				.setDescription('Du saknar den roll som krävs för att rösta här')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		logger.info(`${interaction.user.tag} successfully voted for ${args[1]}.${args[2]}`);

		await interaction.client.customData.voteData.setVote(interaction.client.database, args[1], args[2], interaction.user.id, interaction.values[0]);
		const true_votes = await interaction.client.customData.voteData.getVotes(interaction.client.database, args[1], args[2]);

		const choices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[1], args[2]);
		const summary = generateSummary(choices, true_votes);

		await interaction.message.edit(await voteMessage(interaction.client, args[1], voteData, choices, false, summary));

		const embed = new EmbedBuilder()
			.setTitle('Röstat')
			.setDescription(`Din röst har nu satts till "${interaction.values[0]}"`)
			.setColor('Green');

		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
);