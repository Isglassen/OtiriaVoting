import { ActionRowBuilder, CacheType, ComponentType, EmbedBuilder, InteractionCollector, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import { ButtonData, CustomButtomInteraction, CustomModalInteraction } from "../customClient";
import { voteCreateMessage } from "../messageCreators";

module.exports = new ButtonData(
  'name',
  async function (interaction: CustomButtomInteraction) {
    let args = interaction.customId.split('.')

    let currentName = await interaction.client.customData.votes.getProperty(interaction.client.database, args[1], parseInt(args[2]), 'name')

    let modal = new ModalBuilder()
      .setCustomId(interaction.customId)
      .setTitle(`Ändra namn på röstningen **${currentName}**`)
      .addComponents([
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents([
            new TextInputBuilder()
              .setCustomId('newName')
              .setLabel('Skriv in ett nytt namn')
              .setPlaceholder(currentName)
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
          ])
      ]);

    await interaction.showModal(modal)

    let modal_interaction: ModalSubmitInteraction<CacheType>
    try {
      modal_interaction = await interaction.awaitModalSubmit({
        time: 60_000,
        filter: i => i.customId == interaction.customId
      })
    } catch (error) {
      if (error.code != "InteractionCollectorError") throw error
    }

    let response = modal_interaction.fields.getTextInputValue('newName')
    if (response.length < 1 || response === currentName) {
      const replyEmbed = new EmbedBuilder()
        .setTitle('Ingen ändring')
        .setDescription('Du skrev inte in något namn eller så var det samma som tidigare')
        .setColor("Greyple");

      await modal_interaction.reply({ embeds: [replyEmbed], ephemeral: true });
      return;
    }

    const replyEmbed = new EmbedBuilder()
      .setTitle('Ändrat')
      .setDescription(`Röstningens namn har nu ändrats till **${response}**`)
      .setColor("Green")

    await modal_interaction.reply({ embeds: [replyEmbed], ephemeral: true })
    await interaction.client.customData.votes.updateProperty(interaction.client.database, args[1], parseInt(args[2]), 'name', response)
    let fullData = await interaction.client.customData.votes.getFull(interaction.client.database, args[1], parseInt(args[2]))
    await interaction.message.edit(await voteCreateMessage(interaction.client, args[1], fullData))
  }
)