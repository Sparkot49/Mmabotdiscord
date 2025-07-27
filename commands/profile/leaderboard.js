const { SlashCommandBuilder } = require('discord.js');
const User = require('../../src/models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show top players by Elo'),
  async execute(interaction) {
    const top = await User.find().sort({ elo: -1 }).limit(10);
    const description = top.map((u, i) => `${i + 1}. <@${u.userId}> - ${u.elo} Elo`).join('\n');
    const embed = { title: 'Global Leaderboard', description };
    return interaction.reply({ embeds: [embed] });
  }
};
