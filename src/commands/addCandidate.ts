import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CommandData, CustomAutocompleteInteraction, CustomClient, CustomCommandInteraction } from '../customClient';
import { serverVoteData } from '../databaseActions';
import idAutocorrect, { checkCreating, getCreating } from '../idAutocorrect';
import { voteCreateMessage } from '../messageCreators';

module.exports = new CommandData(
	new SlashCommandBuilder()
		.setName('add-choice')
		.setDescription('Add a choice to the vote')
		.setNameLocalization('sv-SE', 'lägg-till-alternativ')
		.setDescriptionLocalization('sv-SE', 'Lägg till ett alternativ till röstningen')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.setDMPermission(false)
		.addStringOption(option => option
			.setName('vote-id')
			.setDescription('The id of the vote')
			.setNameLocalization('sv-SE', 'röstnings-id')
			.setDescriptionLocalization('sv-SE', 'Röstningens id')
			.setRequired(true)
			.setAutocomplete(true))
		.addStringOption(option => option
			.setName('choice-name')
			.setDescription('The name of the choice to add')
			.setNameLocalization('sv-SE', 'alternativ-namn')
			.setDescriptionLocalization('sv-SE', 'Det nya alternativets namn')
			.setRequired(true)
			.setMinLength(1)
			.setMaxLength(32))
		.addStringOption(option => option
			.setName('choice-description')
			.setDescription('The description of the choice to add')
			.setNameLocalization('sv-SE', 'alternativ-beskrivning')
			.setDescriptionLocalization('sv-SE', 'Det nya alternativets beskrivning')
			.setRequired(true)
			.setMinLength(1)
			.setMaxLength(256)),
	async function(interaction: CustomCommandInteraction) {
		const vote_id = interaction.options.getString('vote-id', true);
		const new_name = interaction.options.getString('choice-name', true);
		const new_description = interaction.options.getString('choice-description', true);
		const args = vote_id.split('.');

		console.log(`${interaction.user.tag} tried to add option ${new_name}: ${new_description} to ${vote_id}`);

		if (args[0] != interaction.guildId) {
			console.log(`${interaction.user.tag} failed to change name of ${vote_id} because it's in an other guild`);
			const embed = new EmbedBuilder()
				.setTitle('Kunde inte lägga till alternativ')
				.setDescription('Det id du anget är för en röstning på en annan server')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		const currentChoices = await interaction.client.customData.votes.getProperty(interaction.client.database, args[0], parseInt(args[1]), 'candidates');

		if (currentChoices == null) {
			console.log(`${interaction.user.tag} failed to add option to ${vote_id} because the vote is not in the database`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kunnde inte hitta röstningen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		if (!checkCreating(interaction, args[0], parseInt(args[1]))) return;

		if (currentChoices.some((val) => val.name == new_name)) {
			console.log(`${interaction.user.tag} couldn't add option to ${vote_id} because it already had the specified name`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Kunde inte lägga till alternativ eftersom ett alternativ med samma namn redan finns')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		if (currentChoices.length >= 25) {
			console.log(`${interaction.user.tag} couldn't add option to ${vote_id} because it has the maximum option count`);
			const embed = new EmbedBuilder()
				.setTitle('Misslyckades')
				.setDescription('Röstningen har redan 25 alternativ, vilket är gränsen')
				.setColor('Red');

			await interaction.reply({ embeds: [embed], ephemeral: true });
			return;
		}

		await interaction.client.customData.votes.updateProperty(interaction.client.database, args[0], parseInt(args[1]), 'candidates', [... currentChoices, { name: new_name, description: new_description }]);

		console.log(`${interaction.user.tag} successfully added option to ${vote_id}`);
		const embed = new EmbedBuilder()
			.setTitle('Klart!')
			.setDescription(`Alternativet "${new_name}" har nu laggts till`)
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
	idAutocorrect(getCreating),
);