import { ChannelType, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CommandData, CustomAutocompleteInteraction, CustomClient, CustomCommandInteraction } from '../customClient';
import { serverVoteData } from '../databaseActions';
import idAutocorrect from '../idAutocorrect';
import { voteCreateMessage } from '../messageCreators';

module.exports = new CommandData(
	new SlashCommandBuilder()
		.setName('change-ping')
		.setDescription('Change the announcement mention role')
		.setNameLocalization('sv-SE', 'ändra-ping')
		.setDescriptionLocalization('sv-SE', 'Ändra nyhets ping rollen')
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
			.setDescription('The new ping role to mention')
			.setNameLocalization('sv-SE', 'roll')
			.setDescriptionLocalization('sv-SE', 'Den nya ping rollen som ska nämnas')
			.setRequired(false)),
	async function(interaction: CustomCommandInteraction) {
		const vote_id = interaction.options.getString('vote-id', true);
		const new_role = interaction.options.getRole('role', false);
		const args = vote_id.split('.');

		console.log(`${interaction.user.tag} tried to change the mention of ${vote_id} to ${new_role.id}`);

		if (args[0] != interaction.guildId) {
			console.log(`${interaction.user.tag} failed to change mention of ${vote_id} because it's in an other guild`);
			const embed = new EmbedBuilder()
				.setTitle('Kunde inte ändra ping roll')
				.setDescription('Det id du anget är för en röstning på en annan server')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const oldRole = await interaction.client.customData.votes.getProperty(interaction.client.database, args[0], parseInt(args[1]), 'mention_role_id');

		if (oldRole === null) {
			console.log(`${interaction.user.tag} failed to change mention of ${vote_id} because the vote is not in the database`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kunnde inte hitta röstningen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const new_role_id = new_role === null ? undefined : new_role.id;

		if (oldRole === new_role_id) {
			console.log(`${interaction.user.tag} didn't change mention of ${vote_id} because it already had the specified role`);
			const embed = new EmbedBuilder()
				.setTitle('Klart!')
				.setDescription('Ping rollen ändrades inte eftersom du angav samma roll som redan var')
				.setColor('Green');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		await interaction.client.customData.votes.updateProperty(interaction.client.database, args[0], parseInt(args[1]), 'channel_id', new_role_id);

		console.log(`${interaction.user.tag} successfully changed the role of ${vote_id}`);
		const embed = new EmbedBuilder()
			.setTitle('Klart!')
			.setDescription(`Rollen har nu ändrats till "${new_role === null ? '*Ingen*' : new_role}"`)
			.setColor('Green');

		await interaction.reply({ embeds: [embed], ephemeral: true });

		const newData = await interaction.client.customData.votes.getFull(interaction.client.database, args[0], parseInt(args[1]));
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
	idAutocorrect,
);