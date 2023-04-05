import { CustomAutocompleteInteraction, CustomClient } from './customClient';
import { serverVoteData } from './databaseActions';

export default async function idAutocorrect(interaction: CustomAutocompleteInteraction) {
	const focusedOption = interaction.options.getFocused();

	const choices = await getPossibilities(interaction.client, interaction.guildId);

	const filters: ((choice: serverVoteData) => boolean)[] = [
		choice => `${interaction.guildId}.${choice.creation_time}`.startsWith(focusedOption),
		choice => choice.creation_time.toString().startsWith(focusedOption),
		choice => choice.name.startsWith(focusedOption),
	];

	const filterFn = (choice) => {
		for (let i = 0; i < filters.length; i++) {
			if (filters[i](choice)) return true;
		}
		return false;
	};

	const filtered = choices.filter(filterFn);

	await interaction.respond(
		filtered.map(choice => ({ name: `${choice.name}: ${interaction.guildId}.${choice.creation_time}`, value: `${interaction.guildId}.${choice.creation_time}` })),
	);
}

async function getPossibilities(client: CustomClient, guildId: string): Promise<serverVoteData[]> {
	// TODO: Query with these filters instead of filtering everything here
	const votes = await client.customData.votes.getAll(client.database, guildId);
	const editable = votes.filter((value) => value.started == false);
	return editable;
}