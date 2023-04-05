import { AnySelectMenuInteraction, ComponentType, StringSelectMenuInteraction } from 'discord.js';
import { SelectMenuData } from '../customClient';

module.exports = new SelectMenuData(
	'vote',
	ComponentType.StringSelect,
	async function(interaction: AnySelectMenuInteraction) {
		if (!interaction.isStringSelectMenu()) return;

		// TODO
	},
);