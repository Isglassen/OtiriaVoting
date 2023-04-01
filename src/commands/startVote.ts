import { voteCreateMessage } from "../messageCreators";
import { serverVoteData } from "../databaseActions";
import { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { CommandData, CustomCommandInteraction } from "../customClient";

module.exports = new CommandData(
  new SlashCommandBuilder()
    .setName('create-vote')
    .setDescription('Starts creating a vote')
    .setNameLocalization('sv-SE', 'skapa-röstning')
    .setDescriptionLocalization('sv-SE', 'Påbörjar skapandet av en röstning')
    .setDefaultMemberPermissions(new PermissionsBitField(["Administrator", "ManageRoles"]).bitfield),
  async function (interaction: CustomCommandInteraction) {
    // Create base command data
    const voteData: serverVoteData = {
      name: "Ny röstning",
      create_message_channel_id: "",
      create_message_id: "",
      creation_time: +new Date,
      candidates: [],
      started: false,
      ended: false,
    }

    // Respond so we can save the message id
    let message = await interaction.reply({...voteCreateMessage(interaction.guildId, voteData), fetchReply: true});
    voteData.create_message_channel_id = message.channelId;
    voteData.create_message_id = message.id;

    // Save command data
    await interaction.client.customData.votes.createVote(interaction.client.database, interaction.guildId, voteData);
    
    console.log(JSON.stringify(voteData))
  }
)

