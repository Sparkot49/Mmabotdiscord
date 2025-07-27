const { SlashCommandBuilder } = require('discord.js');
const User = require('../../src/models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Show your money balance'),
  async execute(interaction) {
    let user = await User.findOne({ userId: interaction.user.id });
    if (!user) user = await User.create({ userId: interaction.user.id });
    await interaction.reply(`You have ${user.money} coins.`);
  }
};
