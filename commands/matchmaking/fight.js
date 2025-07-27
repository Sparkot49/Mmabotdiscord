const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../src/models/User');

const queue = [];

async function startFight(p1, p2) {
  p1.channel.send(`Fight between <@${p1.id}> and <@${p2.id}> starting!`);
  const winner = Math.random() > 0.5 ? p1 : p2;
  const loser = winner === p1 ? p2 : p1;

  const winnerData = await User.findOneAndUpdate({ userId: winner.id }, { $inc: { wins: 1, elo: 10, money: 50 } }, { upsert: true, new: true });
  const loserData = await User.findOneAndUpdate({ userId: loser.id }, { $inc: { losses: 1, elo: -10, money: -20 } }, { upsert: true, new: true });

  winner.channel.send(`You won against ${loser.username}!`);
  loser.channel.send(`You lost against ${winner.username}!`);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fight')
    .setDescription('Enter matchmaking queue'),
  async execute(interaction) {
    queue.push(interaction.user);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('fight_ai')
        .setLabel('Jouer contre une IA')
        .setStyle(ButtonStyle.Secondary)
    );
    await interaction.reply({ content: 'Waiting for an opponent...', components: [row], ephemeral: true });
    if (queue.length >= 2) {
      const [p1, p2] = queue.splice(0, 2);
      startFight(p1, p2);
    }
  }
};
