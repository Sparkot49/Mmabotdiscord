const { SlashCommandBuilder } = require('discord.js');
const User = require('../../src/models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('premium')
    .setDescription('Manage premium status')
    .addSubcommand(sc => sc.setName('add').setDescription('Grant premium')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(sc => sc.setName('remove').setDescription('Remove premium')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))),
  async execute(interaction) {
    if (interaction.user.id !== '648619791107620887') return interaction.reply({ content: 'Unauthorized', ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const userOption = interaction.options.getUser('user');
    const user = await User.findOneAndUpdate({ userId: userOption.id }, { premium: sub === 'add' }, { upsert: true, new: true });
    return interaction.reply(`${sub === 'add' ? 'Granted' : 'Removed'} premium for ${userOption.username}.`);
  }
};
