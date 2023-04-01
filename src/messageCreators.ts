import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, InteractionReplyOptions } from "discord.js";
import { serverVoteData } from "./databaseActions";

export function voteCreateMessage(guild_id: string, voteData: serverVoteData): InteractionReplyOptions {
  let embed = new EmbedBuilder()
    .setTitle('Skapa röstning')
    .setDescription('Tryck på knapparna för att ändra på dessa fälten tills röstningen är som du vill ha den')
    .setColor('Blurple')
    .addFields([
      { name: 'Röstningens namn', value: voteData.name },
      { name: 'Röstningen skapades', value: new Date(voteData.creation_time).toUTCString() },
      { name: 'Röstningens alternativ', value: voteData.candidates.length > 0 ? '**' + voteData.candidates.join('**, **') + '**' : '*Inga än*' },
      { name: 'Har startat', value: voteData.started ? "Ja" : "Nej", inline: true },
      { name: 'Har avslutats', value: voteData.ended ? "Ja" : "Nej", inline: true }
    ]);
  if ('channel_id' in voteData && 'message_id' in voteData) {
    embed.addFields([{ name: 'Meddelande', value: `https://discord.com/channels/${guild_id}/${voteData.channel_id}/${voteData.message_id}` }]);
  }

  let components = [new ActionRowBuilder<ButtonBuilder>()
    .addComponents([
      new ButtonBuilder()
        .setLabel('Ändra namn')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`name.${guild_id}.${voteData.creation_time}`)
        .setDisabled(voteData.started),
      new ButtonBuilder()
        .setLabel('Lägg till alternativ')
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`add.${guild_id}.${voteData.creation_time}`)
        .setDisabled(voteData.started),
      new ButtonBuilder()
        .setLabel('Ta bort alternativ')
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`remove.${guild_id}.${voteData.creation_time}`)
        .setDisabled(voteData.started),
      new ButtonBuilder()
        .setLabel('Starta röstning')
        .setStyle(ButtonStyle.Success)
        .setCustomId(`start.${guild_id}.${voteData.creation_time}`)
        .setDisabled(voteData.started),
      new ButtonBuilder()
        .setLabel('Avsluta röstning')
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`stop.${guild_id}.${voteData.creation_time}`)
        .setDisabled(!voteData.started || voteData.ended)
    ])]

  return { embeds: [embed], components: components }
}