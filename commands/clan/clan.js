const { SlashCommandBuilder } = require('discord.js');
const User = require('../../src/models/User');
const Clan = require('../../src/models/Clan');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clan')
    .setDescription('Clan management')
    .addSubcommand(sc => sc.setName('create').setDescription('Create a clan').addStringOption(o => o.setName('name').setDescription('Clan name').setRequired(true)))
    .addSubcommand(sc => sc.setName('join').setDescription('Join a clan').addStringOption(o => o.setName('name').setDescription('Clan name').setRequired(true)))
    .addSubcommand(sc => sc.setName('leave').setDescription('Leave your clan'))
    .addSubcommand(sc => sc.setName('info').setDescription('Info about a clan').addStringOption(o => o.setName('name').setDescription('Clan name').setRequired(true))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'create') {
      const name = interaction.options.getString('name');
      const existing = await Clan.findOne({ name });
      if (existing) return interaction.reply({ content: 'Clan already exists.', ephemeral: true });
      const clan = await Clan.create({ name });
      const user = await User.findOneAndUpdate({ userId: interaction.user.id }, { clan: clan._id }, { upsert: true, new: true });
      clan.members.push(user._id);
      await clan.save();
      return interaction.reply(`Clan ${name} created and joined.`);
    }

    if (sub === 'join') {
      const name = interaction.options.getString('name');
      const clan = await Clan.findOne({ name });
      if (!clan) return interaction.reply({ content: 'Clan not found.', ephemeral: true });
      const user = await User.findOneAndUpdate({ userId: interaction.user.id }, { clan: clan._id }, { upsert: true, new: true });
      if (!clan.members.includes(user._id)) {
        clan.members.push(user._id);
        await clan.save();
      }
      return interaction.reply(`Joined clan ${name}.`);
    }

    if (sub === 'leave') {
      const user = await User.findOne({ userId: interaction.user.id });
      if (!user || !user.clan) return interaction.reply({ content: 'You are not in a clan.', ephemeral: true });
      const clan = await Clan.findById(user.clan);
      clan.members = clan.members.filter(m => m.toString() !== user._id.toString());
      await clan.save();
      user.clan = null;
      await user.save();
      return interaction.reply('Left the clan.');
    }

    if (sub === 'info') {
      const name = interaction.options.getString('name');
      const clan = await Clan.findOne({ name }).populate('members');
      if (!clan) return interaction.reply({ content: 'Clan not found.', ephemeral: true });
      const embed = {
        title: `Clan ${clan.name}`,
        fields: [
          { name: 'Elo', value: clan.elo.toString(), inline: true },
          { name: 'Members', value: clan.members.length.toString(), inline: true }
        ]
      };
      return interaction.reply({ embeds: [embed] });
    }
  }
};
