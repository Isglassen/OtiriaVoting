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

	const choiceName = (choice: serverVoteData) => {
		const choiceDate = new Date(choice.creation_time);
		// Add repeating lead 0 (min - val.toString().length) times to start of val.toString() and return it
		const lead0 = (val:any, min:number = 2) => '0'.repeat(Math.max(min - val.toString().length, 0)) + val.toString();

		return `${choice.name}: ${choiceDate.getFullYear()}-${lead0(choiceDate.getMonth() + 1)}-${lead0(choiceDate.getDate())} ${lead0(choiceDate.getHours())}:${lead0(choiceDate.getMinutes())}:${lead0(choiceDate.getSeconds())} (${lead0(choiceDate.getMilliseconds(), 3)})`;
	};

	await interaction.respond(
		filtered.map(choice => ({ name: choiceName(choice), value: `${interaction.guildId}.${choice.creation_time}` })),
	);
}

async function getPossibilities(client: CustomClient, guildId: string): Promise<serverVoteData[]> {
	// TODO: Query with these filters instead of filtering everything here
	const votes = await client.customData.votes.getAll(client.database, guildId);
	const editable = votes.filter((value) => value.started == false);
	return editable;
}