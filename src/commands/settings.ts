import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { CommandData, CustomCommandInteraction } from "../customClient";

module.exports = new CommandData(
  new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Change the server settings')
    .setNameLocalization('sv-SE', 'inställningar')
    .setDescriptionLocalization('sv-SE', 'Ändra på serverns inställningar')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(subcommand => subcommand
      .setName('announcements')
      .setDescription('Sets the bot announcement channel')
      .addChannelOption(option => option
        .setName('channel')
        .setDescription('The channel to announce votes in')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('log')
      .setDescription('Sets the bot log channel')
      .addChannelOption(option => option
        .setName('channel')
        .setDescription('The channel to log information in')
        .setRequired(true))),
  async function (interaction: CustomCommandInteraction) {

  }
);