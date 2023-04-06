import { ComponentType } from 'discord.js';
import { CustomSelectMenuInteraction, SelectMenuData } from '../customClient';

module.exports = new SelectMenuData(
	'vote',
	ComponentType.StringSelect,
	async function(interaction: CustomSelectMenuInteraction) {
		console.log(JSON.stringify(interaction.values));
		if (!interaction.isStringSelectMenu()) return;
		// TODO
	},
);