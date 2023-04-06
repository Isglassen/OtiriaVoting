import { ComponentType, EmbedBuilder } from 'discord.js';
import { CustomSelectMenuInteraction, SelectMenuData } from '../customClient';

// TODO: Check users role

module.exports = new SelectMenuData(
	'vote',
	ComponentType.StringSelect,
	async function(interaction: CustomSelectMenuInteraction) {
		console.log(JSON.stringify(interaction.values));
		if (!interaction.isStringSelectMenu()) return;

		const args = interaction.customId.split('.');

		console.log(`${interaction.user.tag} tried to vote for ${args[1]}.${args[2]}`);

		const can_vote_id = await interaction.client.customData.votes.getProperty(interaction.client.database, args[1], parseInt(args[2]), 'can_vote_id');

		if (can_vote_id === null) {
			console.log(`${interaction.user.tag} failed to vote for ${args[1]}.${args[2]} because the vote is not in the database`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kunnde inte hitta röstningen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		if (
			(Array.isArray(interaction.member.roles) && !interaction.member.roles.includes(can_vote_id))
			|| (!Array.isArray(interaction.member.roles)) && !interaction.member.roles.cache.some(role => role.id == can_vote_id)
		) {
			console.log(`${interaction.user.tag} failed to vote for ${args[1]}.${args[2]} because they did not have permissions`);
			const embed = new EmbedBuilder()
				.setTitle('Ingen rösträtt')
				.setDescription('Du saknar den roll som krävs för att rösta här')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		await interaction.client.customData.voteData.setVote(interaction.client.database, args[1], parseInt(args[2]), interaction.user.id, interaction.values[0]);

		const embed = new EmbedBuilder()
			.setTitle('Röstat')
			.setDescription(`Din röst har nu satts till "${interaction.values[0]}"`)
			.setColor('Green');

		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
);