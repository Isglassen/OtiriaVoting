import { ChannelType, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CommandData, CustomAutocompleteInteraction, CustomClient, CustomCommandInteraction } from '../customClient';
import { serverVoteData } from '../databaseActions';
import idAutocorrect, { checkCreating, getCreating } from '../idAutocorrect';
import { checkCreateMessage, voteCreateMessage } from '../messageCreators';

module.exports = new CommandData(
	new SlashCommandBuilder()
		.setName('change-voting-rights')
		.setDescription('Change the role required to vote')
		.setNameLocalization('sv-SE', 'ändra-rösträtt')
		.setDescriptionLocalization('sv-SE', 'Ändra role som krävs för rösträtt')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.setDMPermission(false)
		.addStringOption(option => option
			.setName('vote-id')
			.setDescription('The id of the vote')
			.setNameLocalization('sv-SE', 'röstnings-id')
			.setDescriptionLocalization('sv-SE', 'Röstningens id')
			.setRequired(true)
			.setAutocomplete(true))
		.addRoleOption(option => option
			.setName('role')
			.setDescription('The new roll required to vote')
			.setNameLocalization('sv-SE', 'roll')
			.setDescriptionLocalization('sv-SE', 'Den nya rollen som krävs för att rösta')
			.setRequired(true)),
	async function(interaction: CustomCommandInteraction) {
		const vote_id = interaction.options.getString('vote-id', true);
		const new_role = interaction.options.getRole('role', true);
		const args = vote_id.split('.');

		const logger = interaction.client.logger;

		logger.info(`${interaction.user.tag} tried to change the rights of ${vote_id} to ${new_role}`);

		if (!await checkCreateMessage(interaction)) return;

		if (args[0] != interaction.guildId) {
			logger.info(`${interaction.user.tag} failed to change rights of ${vote_id} because it's in an other guild`);
			const embed = new EmbedBuilder()
				.setTitle('Kunde inte ändra rösträtt')
				.setDescription('Det id du anget är för en röstning på en annan server')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const oldRole = await interaction.client.customData.votes.getProperty(interaction.client.database, args[0], args[1], 'can_vote_id');

		if (oldRole === undefined) {
			logger.info(`${interaction.user.tag} failed to change rights of ${vote_id} because the vote is not in the database`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kunnde inte hitta röstningen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		if (!await checkCreating(interaction, args[0], args[1])) return;

		if (oldRole === new_role.id) {
			logger.info(`${interaction.user.tag} didn't change rights of ${vote_id} because it already had the specified role`);
			const embed = new EmbedBuilder()
				.setTitle('Klart!')
				.setDescription('Rösträtt rollen ändrades inte eftersom du angav samma roll som redan var')
				.setColor('Green');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		await interaction.client.customData.votes.updateProperty(interaction.client.database, args[0], args[1], 'can_vote_id', new_role.id);

		logger.info(`${interaction.user.tag} successfully changed the rights of ${vote_id}`);
		const embed = new EmbedBuilder()
			.setTitle('Klart!')
			.setDescription(`Rollen har nu ändrats till "${new_role}"`)
			.setColor('Green');

		await interaction.reply({ embeds: [embed], ephemeral: true });

		const newData = await interaction.client.customData.votes.getFull(interaction.client.database, args[0], args[1]);
		const choices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[0], args[1]);
		const infoMessageChannel = await interaction.guild.channels.fetch(newData.status_message_channel_id);

		if (!infoMessageChannel.isTextBased()) {
			logger.warn(`Info message channel ${newData.status_message_channel_id} is not text based for vote ${args.join('.')}`);
			return;
		}

		const infoMessage = await infoMessageChannel.messages.fetch(newData.status_message_id);

		if (!infoMessage) {
			logger.warn(`Info message ${newData.status_message_channel_id}.${newData.status_message_id} does not exist for vote ${args.join('.')}`);
			return;
		}

		await infoMessage.edit(await voteCreateMessage(interaction.client, args[0], newData, choices, false));
	},
	idAutocorrect(getCreating),
);