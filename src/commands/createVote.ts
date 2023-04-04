import { getRole, voteCreateMessage } from '../messageCreators';
import { serverVoteData } from '../databaseActions';
import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CommandData, CustomCommandInteraction } from '../customClient';

module.exports = new CommandData(
	new SlashCommandBuilder()
		.setName('create-vote')
		.setDescription('Starts creating a vote')
		.setNameLocalization('sv-SE', 'skapa-röstning')
		.setDescriptionLocalization('sv-SE', 'Påbörjar skapandet av en röstning')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.addStringOption(option => option
			.setName('name')
			.setDescription('The name of the vote')
			.setNameLocalization('sv-SE', 'namn')
			.setDescriptionLocalization('sv-SE', 'Röstningens namn')
			.setRequired(true)
			.setMinLength(1)
			.setMaxLength(64))
		.addStringOption(option => option
			.setName('description')
			.setDescription('The description of the vote')
			.setNameLocalization('sv-SE', 'beskrivning')
			.setDescriptionLocalization('sv-SE', 'Röstningens beskrivning')
			.setRequired(true)
			.setMinLength(1)
			.setMaxLength(512))
		.addChannelOption(option => option
			.setName('vote-channel')
			.setDescription('The channel for vote announcements')
			.setNameLocalization('sv-SE', 'röstnings-kanal')
			.setDescriptionLocalization('sv-SE', 'Kanalen för röstningsmeddelanden')
			.setRequired(true)
			.addChannelTypes(ChannelType.GuildText))
		.addStringOption(option => option
			.setName('choices')
			.setDescription('A "," seperated list of choices for the vote. If you want to add a choice including the "," character you can use /add-option after this')
			.setNameLocalization('sv-SE', 'alternativ')
			.setDescriptionLocalization('sv-SE', 'En "," separerad lista av alternativ för röstningen. Om du vill ha "," i ett alternativ kan du använda /lägg-till-alternativ senare')
			.setRequired(false)
			.setMinLength(1))
		.addRoleOption(option => option
			.setName('voting-rights')
			.setDescription('The role required to participate in the vote')
			.setNameLocalization('sv-SE', 'rösträtt')
			.setDescriptionLocalization('sv-SE', 'Rollen som krävs för att delta i röstningen')
			.setRequired(false))
		.addRoleOption(option => option
			.setName('ping')
			.setDescription('The role to mention for vote announcements')
			.setDescriptionLocalization('sv-SE', 'Rollen som ska nämnas för röstningsmeddelanden')
			.setRequired(false))
	,
	async function(interaction: CustomCommandInteraction) {
		const name = interaction.options.getString('name', true);
		const description = interaction.options.getString('description', true);
		const choices = interaction.options.getString('choices', false);
		const candidates = choices == null ? [] : choices.split(',').map((val => val.trim()));
		const channel = interaction.options.getChannel('vote-channel', true, [ChannelType.GuildText]);
		const rights = interaction.options.getRole('voting-rights', false);
		const can_vote_id = rights == null ? await getRole(interaction.client, interaction.guildId) : rights;
		const ping = interaction.options.getRole('ping', false);
		const mention_role_id = ping == null ? undefined : ping;

		// Create base command data
		const voteData: serverVoteData = {
			name: name,
			description: description,
			create_message_channel_id: '',
			create_message_id: '',
			creation_time: +new Date,
			candidates: candidates,
			started: false,
			ended: false,
			channel_id: channel.id,
			can_vote_id: can_vote_id.id,
			mention_role_id: mention_role_id.id,
		};

		console.log(`${interaction.user.tag} created vote ${interaction.guildId}.${voteData.creation_time} at ${new Date(voteData.creation_time).toUTCString()}`);

		// Respond so we can save the message id
		const message = await interaction.reply({
			...await voteCreateMessage(interaction.client, interaction.guildId, voteData, true),
			fetchReply: true,
			content: `Skapa röstning

			Använd olika kommandon för att ändra på saker tills röstningen är som du vill ha den
			När du är klar kan du starta och sedan avsluta röstningen med knapparna nedan`,
		});
		voteData.create_message_channel_id = message.channelId;
		voteData.create_message_id = message.id;

		// Save command data
		await interaction.client.customData.votes.createVote(interaction.client.database, interaction.guildId, voteData);
		await message.edit(await voteCreateMessage(interaction.client, interaction.guildId, voteData));
	},
);