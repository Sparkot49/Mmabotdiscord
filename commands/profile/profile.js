const { SlashCommandBuilder } = require('discord.js');
const User = require('../../src/models/User');
const Clan = require('../../src/models/Clan');

function getLeague(elo) {
  if (elo < 800) return '🥉 Bronze';
  if (elo < 1200) return '🥈 Silver';
  return '🥇 Gold';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Afficher ton profil MMA'),
  async execute(interaction) {
    let user = await User.findOne({ userId: interaction.user.id }).populate('clan');
    if (!user) user = await User.create({ userId: interaction.user.id });

    const embed = {
      title: `Profil de ${interaction.user.username}`,
      fields: [
        { name: 'Ligue', value: getLeague(user.elo), inline: true },
        { name: 'Elo', value: String(user.elo), inline: true },
        { name: 'Victoires', value: String(user.wins), inline: true },
        { name: 'Défaites', value: String(user.losses), inline: true },
        { name: 'Argent', value: String(user.money), inline: true },
        { name: 'Clan', value: user.clan ? user.clan.name : 'Aucun', inline: true },
        { name: 'Premium', value: user.premium ? 'Oui' : 'Non', inline: true }
      ]
    };

    await interaction.reply({ embeds: [embed] });
  }
};
