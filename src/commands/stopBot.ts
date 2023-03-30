import { SlashCommandBuilder, Team, EmbedBuilder } from "discord.js";
import { CustomCommandInteraction } from "../customClient";
import * as util from 'util'

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stopBot")
    .setDescription("Safely stops the bot")
    .setNameLocalization("sv-SE", "stannaBot")
    .setDescriptionLocalization("sv-SE", "Stannar boten på ett säkert sätt")
    .setDefaultMemberPermissions('0'),
  async execute(interaction: CustomCommandInteraction) {
    async function noPermission() {
      let embed = new EmbedBuilder()
      .setTitle("Stop!")
      .setDescription("Du äger inte denna boten, så du kan inte stänga av den")
      .setColor("Red");

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.client.application.owner instanceof Team) {
      let fromOwner = false;

      interaction.client.application.owner.members.forEach((_, id) => {
        if (interaction.user.id == id) fromOwner = true;
      })

      if (!fromOwner) { await noPermission(); return; }
    }
    else if (interaction.user.id != interaction.client.application.owner.id) { await noPermission(); return; }

    let embed = new EmbedBuilder()
      .setTitle("Stannar!")
      .setDescription("Boten är helt av om 5 sekunder")
      .setColor("Blurple");

    await interaction.reply({ embeds: [embed], ephemeral: true });

    interaction.client.destroy();

    await util.promisify(setTimeout)(5000);

    await interaction.client.database.saveAll(interaction.client.customData);
    await interaction.client.database.end();
  }
}