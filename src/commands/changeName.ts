import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CommandData, CustomCommandInteraction } from '../customClient';

// module.exports = new CommandData(
// 	new SlashCommandBuilder()
// 		.setName('change-name')
// 		.setDescription('Change the name of a vote')
// 		.setNameLocalization('sv-SE', 'ändra-namn')
// 		.setDescriptionLocalization('sv-SE', 'Ändra namnet på en röstning')
// 		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
// 	async function(interaction: CustomCommandInteraction) {

// 	},
// );