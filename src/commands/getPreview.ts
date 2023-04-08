import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CommandData, CustomAutocompleteInteraction, CustomClient, CustomCommandInteraction } from '../customClient';
import { serverVoteData } from '../databaseActions';
import idAutocorrect, { checkCreating, getCreating } from '../idAutocorrect';
import { voteCreateMessage, voteMessage } from '../messageCreators';

module.exports = new CommandData(
	new SlashCommandBuilder()
		.setName('preview')
		.setDescription('Get a preview of the vote')
		.setNameLocalization('sv-SE', 'förhandsgranska')
		.setDescriptionLocalization('sv-SE', 'Få en förhandsgranskning av en röstning')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.setDMPermission(false)
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

		console.log(`${interaction.user.tag} tried to preview vote ${vote_id}`);

		if (args[0] != interaction.guildId) {
			console.log(`${interaction.user.tag} failed to preview vote ${vote_id} because it's in an other guild`);
			const embed = new EmbedBuilder()
				.setTitle('Kunde inte förhandsgranska')
				.setDescription('Det id du anget är för en röstning på en annan server')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const voteData = await interaction.client.customData.votes.getFull(interaction.client.database, args[0], parseInt(args[1]));

		if (voteData === null) {
			console.log(`${interaction.user.tag} failed to preview vote ${vote_id} because the vote is not in the database`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kunnde inte hitta röstningen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		if (!checkCreating(interaction, args[0], parseInt(args[1]))) return;

		console.log(`${interaction.user.tag} successfully previewed vote ${vote_id}`);

		await interaction.reply({ ...await voteMessage(interaction.client, args[0], voteData, true, {}), ephemeral: true });
	},
	idAutocorrect(getCreating),
);