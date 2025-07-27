const { SlashCommandBuilder } = require('discord.js');
const User = require('../../src/models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Show your MMA profile'),
  async execute(interaction) {
    let user = await User.findOne({ userId: interaction.user.id });
    if (!user) {
      user = await User.create({ userId: interaction.user.id });
    }

    const embed = {
      title: `${interaction.user.username}'s Profile`,
      fields: [
        { name: 'Elo', value: user.elo.toString(), inline: true },
        { name: 'Wins', value: user.wins.toString(), inline: true },
        { name: 'Losses', value: user.losses.toString(), inline: true },
        { name: 'Money', value: user.money.toString(), inline: true }
      ]
    };

    await interaction.reply({ embeds: [embed] });
  }
};
