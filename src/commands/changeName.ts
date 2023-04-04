import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CommandData, CustomAutocompleteInteraction, CustomClient, CustomCommandInteraction } from '../customClient';
import { serverVoteData } from '../databaseActions';

module.exports = new CommandData(
	new SlashCommandBuilder()
		.setName('change-name')
		.setDescription('Change the name of a vote')
		.setNameLocalization('sv-SE', 'ändra-namn')
		.setDescriptionLocalization('sv-SE', 'Ändra namnet på en röstning')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.addStringOption(option => option
			.setName('vote-id')
			.setDescription('The id of the vote')
			.setNameLocalization('sv-SE', 'röstnings-id')
			.setDescriptionLocalization('sv-SE', 'Röstningens id')
			.setRequired(true)
			.setAutocomplete(true))
		.addStringOption(option => option
			.setName('name')
			.setDescription('The name of the vote')
			.setNameLocalization('sv-SE', 'namn')
			.setDescriptionLocalization('sv-SE', 'Röstningens nya namn')
			.setRequired(true)
			.setMinLength(1)
			.setMaxLength(64)),
	async function(interaction: CustomCommandInteraction) {
		console.log(JSON.stringify(interaction.options.getString('vote-id')));
		interaction.reply({ content: 'Not finished', ephemeral: true });
	},
	async function(interaction: CustomAutocompleteInteraction) {
		const focusedOption = interaction.options.getFocused();
		const choices = await getActive(interaction.client, interaction.guildId);

		const filtered = choices.filter(choice => `${interaction.guildId}.${choice.creation_time}`.startsWith(focusedOption) || choice.creation_time.toString().startsWith(focusedOption),
		);
		await interaction.respond(
			filtered.map(choice => ({ name: `${choice.name}: ${interaction.guildId}.${choice.creation_time}`, value: `${interaction.guildId}.${choice.creation_time}` })),
		);
	},
);

async function getActive(client: CustomClient, guildId: string): Promise<serverVoteData[]> {
	// TODO: Query with these filters instead of filtering everything here
	const votes = await client.customData.votes.getAll(client.database, guildId);
	const editable = votes.filter((value) => (value.started || value.ended) == false);
	return editable;
}