import { getRole, voteCreateMessage } from '../messageCreators';
import { serverVoteData } from '../databaseActions';
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CommandData, CustomCommandInteraction } from '../customClient';

module.exports = new CommandData(
	new SlashCommandBuilder()
		.setName('create-vote')
		.setDescription('Starts creating a vote')
		.setNameLocalization('sv-SE', 'skapa-röstning')
		.setDescriptionLocalization('sv-SE', 'Påbörjar skapandet av en röstning')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
	async function(interaction: CustomCommandInteraction) {
		// Create base command data
		const voteData: serverVoteData = {
			name: 'Ny röstning',
			create_message_channel_id: '',
			create_message_id: '',
			creation_time: +new Date,
			candidates: [],
			started: false,
			ended: false,
			channel_id: interaction.channelId,
			can_vote_id: (await getRole(interaction.client, interaction.guildId)).id,
		};

		// Respond so we can save the message id
		const message = await interaction.reply({ ...await voteCreateMessage(interaction.client, interaction.guildId, voteData, true), fetchReply: true });
		voteData.create_message_channel_id = message.channelId;
		voteData.create_message_id = message.id;

		// Save command data
		await interaction.client.customData.votes.createVote(interaction.client.database, interaction.guildId, voteData);
		await message.edit(await voteCreateMessage(interaction.client, interaction.guildId, voteData));
	},
);