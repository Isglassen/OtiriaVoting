import { ComponentType, EmbedBuilder } from 'discord.js';
import { CustomSelectMenuInteraction, SelectMenuData } from '../customClient';

module.exports = new SelectMenuData(
	'vote',
	ComponentType.StringSelect,
	async function(interaction: CustomSelectMenuInteraction) {
		console.log(JSON.stringify(interaction.values));
		if (!interaction.isStringSelectMenu()) return;

		const args = interaction.customId.split('.');

		console.log(`${interaction.user.tag} tried to vote for ${args[1]}.${args[2]}`);

		await interaction.client.customData.voteData.setVote(interaction.client.database, args[1], parseInt(args[2]), interaction.user.id, interaction.values[0]);

		const embed = new EmbedBuilder()
			.setTitle('Röstat')
			.setDescription(`Din röst har nu satts till "${interaction.values[0]}"`)
			.setColor('Green');

		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
);