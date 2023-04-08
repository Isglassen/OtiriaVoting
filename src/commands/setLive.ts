import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CommandData, CustomAutocompleteInteraction, CustomClient, CustomCommandInteraction } from '../customClient';
import { serverVoteData } from '../databaseActions';
import idAutocorrect, { checkCreating, getCreating } from '../idAutocorrect';
import { voteCreateMessage } from '../messageCreators';

module.exports = new CommandData(
	new SlashCommandBuilder()
		.setName('set-live-result')
		.setDescription('Change if the vote should have live results')
		.setNameLocalization('sv-SE', 'sätt-live-resultat')
		.setDescriptionLocalization('sv-SE', 'Ändra ifall röstningen ska ha live resultat')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.setDMPermission(false)
		.addStringOption(option => option
			.setName('vote-id')
			.setDescription('The id of the vote')
			.setNameLocalization('sv-SE', 'röstnings-id')
			.setDescriptionLocalization('sv-SE', 'Röstningens id')
			.setRequired(true)
			.setAutocomplete(true))
		.addBooleanOption(option => option
			.setName('live-result')
			.setDescription('Show the current vote numbers even before the vote has ended')
			.setNameLocalization('sv-SE', 'live-resultat')
			.setDescriptionLocalization('sv-SE', 'Visa antalet röster även innan röstningen är slut')
			.setRequired(true)),
	async function(interaction: CustomCommandInteraction) {
		const vote_id = interaction.options.getString('vote-id', true);
		const live_result = interaction.options.getBoolean('live-result', true);
		const args = vote_id.split('.');

		console.log(`${interaction.user.tag} tried to change live result of ${vote_id}`);

		if (args[0] != interaction.guildId) {
			console.log(`${interaction.user.tag} failed to change live result of ${vote_id} because it's in an other guild`);
			const embed = new EmbedBuilder()
				.setTitle('Kunde inte ändra live resultat')
				.setDescription('Det id du anget är för en röstning på en annan server')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const currentLiveResult = await interaction.client.customData.votes.getProperty(interaction.client.database, args[0], args[1], 'live_result');

		if (currentLiveResult === undefined) {
			console.log(`${interaction.user.tag} failed to change live result of ${vote_id} because the vote is not in the database`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kunnde inte hitta röstningen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		if (!checkCreating(interaction, args[0], args[1])) return;

		if (currentLiveResult === live_result) {
			console.log(`${interaction.user.tag} couldn't change live result of ${vote_id} because it already had the specified value`);
			const embed = new EmbedBuilder()
				.setTitle('Ingen ändring')
				.setDescription('Värdet du anget är samma som redan var')
				.setColor('Green');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		await interaction.client.customData.votes.updateProperty(interaction.client.database, args[0], args[1], 'live_result', live_result);

		console.log(`${interaction.user.tag} successfully changed live result of ${vote_id}`);
		const embed = new EmbedBuilder()
			.setTitle('Klart!')
			.setDescription('Har nu ändrat live resulat till det angivna värdet')
			.setColor('Green');

		await interaction.reply({ embeds: [embed], ephemeral: true });

		const newData = await interaction.client.customData.votes.getFull(interaction.client.database, args[0], args[1]);
		const infoMessageChannel = await interaction.guild.channels.fetch(newData.status_message_channel_id);

		if (!infoMessageChannel.isTextBased()) {
			console.warn(`Info message channel ${newData.status_message_channel_id} is not text based for vote ${args.join('.')}`);
			return;
		}

		const infoMessage = await infoMessageChannel.messages.fetch(newData.status_message_id);

		if (!infoMessage) {
			console.warn(`Info message ${newData.status_message_channel_id}.${newData.status_message_id} does not exist for vote ${args.join('.')}`);
			return;
		}

		await infoMessage.edit(await voteCreateMessage(interaction.client, args[0], newData, false));
	},
	idAutocorrect(getCreating),
);