import { ChannelType, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CommandData, CustomAutocompleteInteraction, CustomClient, CustomCommandInteraction } from '../customClient';
import { serverVoteData } from '../databaseActions';
import idAutocorrect, { checkCreating, getCreating } from '../idAutocorrect';
import { voteCreateMessage } from '../messageCreators';

module.exports = new CommandData(
	new SlashCommandBuilder()
		.setName('change-channel')
		.setDescription('Change the announcement channel of a vote')
		.setNameLocalization('sv-SE', 'ändra-kanal')
		.setDescriptionLocalization('sv-SE', 'Ändra nyheteskanalen för en röstning')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.setDMPermission(false)
		.addStringOption(option => option
			.setName('vote-id')
			.setDescription('The id of the vote')
			.setNameLocalization('sv-SE', 'röstnings-id')
			.setDescriptionLocalization('sv-SE', 'Röstningens id')
			.setRequired(true)
			.setAutocomplete(true))
		.addChannelOption(option => option
			.setName('channel')
			.setDescription('The new announcement channel')
			.setNameLocalization('sv-SE', 'namn')
			.setDescriptionLocalization('sv-SE', 'Den nya röstningskanalen')
			.setRequired(true)
			.addChannelTypes(ChannelType.GuildText)),
	async function(interaction: CustomCommandInteraction) {
		const vote_id = interaction.options.getString('vote-id', true);
		const new_channel = interaction.options.getChannel('channel', true, [ChannelType.GuildText]);
		const args = vote_id.split('.');

		console.log(`${interaction.user.tag} tried to change the channel of ${vote_id} to ${new_channel}`);

		if (args[0] != interaction.guildId) {
			console.log(`${interaction.user.tag} failed to change channel of ${vote_id} because it's in an other guild`);
			const embed = new EmbedBuilder()
				.setTitle('Kunde inte byta kanal')
				.setDescription('Det id du anget är för en röstning på en annan server')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const oldChannel = await interaction.client.customData.votes.getProperty(interaction.client.database, args[0], args[1], 'channel_id');

		if (oldChannel === undefined) {
			console.log(`${interaction.user.tag} failed to change channel of ${vote_id} because the vote is not in the database`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kunnde inte hitta röstningen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		if (!checkCreating(interaction, args[0], args[1])) return;

		if (oldChannel == new_channel.id) {
			console.log(`${interaction.user.tag} didn't change channel of ${vote_id} because it already had the specified channel`);
			const embed = new EmbedBuilder()
				.setTitle('Klart!')
				.setDescription('Kanalen ändrades inte eftersom du angav samma kanal som redan var')
				.setColor('Green');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		await interaction.client.customData.votes.updateProperty(interaction.client.database, args[0], args[1], 'channel_id', new_channel.id);

		console.log(`${interaction.user.tag} successfully changed the channel of ${vote_id}`);
		const embed = new EmbedBuilder()
			.setTitle('Klart!')
			.setDescription(`Kanalen har nu ändrats till "${new_channel}"`)
			.setColor('Green');

		await interaction.reply({ embeds: [embed], ephemeral: true });

		const newData = await interaction.client.customData.votes.getFull(interaction.client.database, args[0], args[1]);
		const choices = await interaction.client.customData.choices.getChoices(interaction.client.database, args[0], args[1]);
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

		await infoMessage.edit(await voteCreateMessage(interaction.client, args[0], newData, choices, false));
	},
	idAutocorrect(getCreating),
);