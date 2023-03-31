import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { CommandData, CustomCommandInteraction } from "../customClient";

module.exports = new CommandData(
  new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Change the server settings')
    .setNameLocalization('sv-SE', 'inställningar')
    .setDescriptionLocalization('sv-SE', 'Ändra på serverns inställningar')
    .setDefaultMemberPermissions(new PermissionsBitField(["ManageChannels", "Administrator", "ManageRoles", "MentionEveryone"]).bitfield)
    .addSubcommand(subcommand => subcommand
      .setName('annuncements')
      .setDescription('Sets the bot announcement channel')
      .addChannelOption(option => option
        .setName('channel')
        .setDescription('The channel to announce votes in')
        .setRequired(true))),
  async function(interaction: CustomCommandInteraction) {

  }
);