const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../../src/models/User');
const Clan = require('../../src/models/Clan');

const ADMIN_ID = '648619791107620887';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Administrative commands')
    .addSubcommand(sc => sc.setName('setelo').setDescription('Set user Elo')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true)))
    .addSubcommand(sc => sc.setName('addmoney').setDescription('Add money')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true)))
    .addSubcommand(sc => sc.setName('removemoney').setDescription('Remove money')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true)))
    .addSubcommand(sc => sc.setName('clan-disband').setDescription('Disband clan')
      .addStringOption(o => o.setName('name').setDescription('Clan name').setRequired(true))),
  async execute(interaction) {
    if (interaction.user.id !== ADMIN_ID) return interaction.reply({ content: 'Unauthorized', ephemeral: true });
    const sub = interaction.options.getSubcommand();

    if (sub === 'setelo') {
      const userOption = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      const user = await User.findOneAndUpdate({ userId: userOption.id }, { elo: amount }, { upsert: true, new: true });
      return interaction.reply(`Set Elo of ${userOption.username} to ${amount}.`);
    }

    if (sub === 'addmoney') {
      const userOption = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      const user = await User.findOneAndUpdate({ userId: userOption.id }, { $inc: { money: amount } }, { upsert: true, new: true });
      return interaction.reply(`Added ${amount} money to ${userOption.username}.`);
    }

    if (sub === 'removemoney') {
      const userOption = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      const user = await User.findOneAndUpdate({ userId: userOption.id }, { $inc: { money: -amount } }, { upsert: true, new: true });
      return interaction.reply(`Removed ${amount} money from ${userOption.username}.`);
    }

    if (sub === 'clan-disband') {
      const name = interaction.options.getString('name');
      const clan = await Clan.findOneAndDelete({ name });
      if (!clan) return interaction.reply('Clan not found.');
      await User.updateMany({ clan: clan._id }, { clan: null });
      return interaction.reply(`Clan ${name} disbanded.`);
    }
  }
};
