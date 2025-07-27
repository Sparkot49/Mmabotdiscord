const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../src/models/User');
const Clan = require('../../src/models/Clan');

function getLeague(elo) {
  if (elo < 800) return { name: 'Bronze', emoji: '🥉', color: 0xcd7f32 };
  if (elo < 1200) return { name: 'Argent', emoji: '🥈', color: 0xc0c0c0 };
  if (elo < 1600) return { name: 'Or', emoji: '🥇', color: 0xffd700 };
  if (elo < 2000) return { name: 'Platine', emoji: '💎', color: 0xe5e4e2 };
  if (elo < 2400) return { name: 'Diamant', emoji: '💠', color: 0xb9f2ff };
  if (elo < 2800) return { name: 'Maître', emoji: '🏆', color: 0x9400d3 };
  return { name: 'Grand Maître', emoji: '👑', color: 0xff6347 };
}

function createGlobalLeaderboard(users, page = 0) {
  const itemsPerPage = 10;
  const start = page * itemsPerPage;
  const end = start + itemsPerPage;
  const pageUsers = users.slice(start, end);

  const embed = new EmbedBuilder()
    .setTitle('🏆 CLASSEMENT GLOBAL')
    .setDescription('Les meilleurs combattants de tous les serveurs')
    .setColor(0xffd700)
    .setThumbnail('https://cdn.discordapp.com/emojis/1234567890123456789.png') // Optionnel
    .setTimestamp();

  if (pageUsers.length === 0) {
    embed.addFields([{ name: '📭 Aucun joueur', value: 'Aucun combattant trouvé sur cette page.' }]);
    return embed;
  }

  const leaderboardText = pageUsers.map((user, index) => {
    const position = start + index + 1;
    const league = getLeague(user.elo);
    const winRate = user.wins + user.losses > 0 ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0;
    
    let medal = '';
    if (position === 1) medal = '🥇';
    else if (position === 2) medal = '🥈';
    else if (position === 3) medal = '🥉';
    else medal = `**${position}.**`;

    return `${medal} ${league.emoji} <@${user.userId}>\n` +
           `   📊 **${user.elo}** Elo • 🎯 **${winRate}%** victoires\n` +
           `   ⚔️ ${user.wins}V • 💀 ${user.losses}D • 💰 ${user.money}`;
  }).join('\n\n');

  embed.addFields([
    {
      name: `📈 Page ${page + 1} • Positions ${start + 1}-${Math.min(end, users.length)}`,
      value: leaderboardText
    }
  ]);

  const totalPages = Math.ceil(users.length / itemsPerPage);
  embed.setFooter({ text: `Page ${page + 1}/${totalPages} • ${users.length} combattants au total` });

  return embed;
}

async function createServerLeaderboard(users, guildName, page = 0) {
  const itemsPerPage = 10;
  const start = page * itemsPerPage;
  const end = start + itemsPerPage;
  const pageUsers = users.slice(start, end);

  const embed = new EmbedBuilder()
    .setTitle(`🏟️ CLASSEMENT ${guildName.toUpperCase()}`)
    .setDescription(`Les meilleurs combattants du serveur **${guildName}**`)
    .setColor(0x3498db)
    .setTimestamp();

  if (pageUsers.length === 0) {
    embed.addFields([{ name: '📭 Aucun joueur', value: 'Aucun combattant trouvé sur ce serveur.' }]);
    return embed;
  }

  const leaderboardText = pageUsers.map((user, index) => {
    const position = start + index + 1;
    const league = getLeague(user.elo);
    const winRate = user.wins + user.losses > 0 ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0;
    
    let medal = '';
    if (position === 1) medal = '🥇';
    else if (position === 2) medal = '🥈';
    else if (position === 3) medal = '🥉';
    else medal = `**${position}.**`;

    return `${medal} ${league.emoji} <@${user.userId}>\n` +
           `   📊 **${user.elo}** Elo • 🎯 **${winRate}%** victoires\n` +
           `   ⚔️ ${user.wins}V • 💀 ${user.losses}D`;
  }).join('\n\n');

  embed.addFields([
    {
      name: `📈 Page ${page + 1} • Positions ${start + 1}-${Math.min(end, users.length)}`,
      value: leaderboardText
    }
  ]);

  const totalPages = Math.ceil(users.length / itemsPerPage);
  embed.setFooter({ text: `Page ${page + 1}/${totalPages} • ${users.length} combattants sur ce serveur` });

  return embed;
}

async function createClanLeaderboard(clans, page = 0) {
  const itemsPerPage = 10;
  const start = page * itemsPerPage;
  const end = start + itemsPerPage;
  const pageClans = clans.slice(start, end);

  const embed = new EmbedBuilder()
    .setTitle('🏛️ CLASSEMENT DES CLANS')
    .setDescription('Les clans les plus puissants')
    .setColor(0x8e44ad)
    .setTimestamp();

  if (pageClans.length === 0) {
    embed.addFields([{ name: '📭 Aucun clan', value: 'Aucun clan trouvé sur cette page.' }]);
    return embed;
  }

  const clanText = pageClans.map((clan, index) => {
    const position = start + index + 1;
    
    let medal = '';
    if (position === 1) medal = '🥇';
    else if (position === 2) medal = '🥈';
    else if (position === 3) medal = '🥉';
    else medal = `**${position}.**`;

    const avgElo = clan.members.length > 0 ? Math.round(clan.elo / clan.members.length) : 0;

    return `${medal} **${clan.name}**\n` +
           `   🏆 **${clan.elo}** Elo total • 📊 **${avgElo}** Elo moyen\n` +
           `   👥 ${clan.members.length} membres`;
  }).join('\n\n');

  embed.addFields([
    {
      name: `📈 Page ${page + 1} • Positions ${start + 1}-${Math.min(end, clans.length)}`,
      value: clanText
    }
  ]);

  const totalPages = Math.ceil(clans.length / itemsPerPage);
  embed.setFooter({ text: `Page ${page + 1}/${totalPages} • ${clans.length} clans au total` });

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Afficher les classements')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type de classement à afficher')
        .setRequired(false)
        .addChoices(
          { name: '🏆 Global (tous serveurs)', value: 'global' },
          { name: '🏟️ Serveur actuel', value: 'server' },
          { name: '🏛️ Clans', value: 'clans' }
        )),

  async execute(interaction) {
    const type = interaction.options.getString('type') || 'global';
    let currentPage = 0;
    let currentType = type;

    // Fonction pour créer les boutons de navigation
    const createButtons = (page, totalPages, showTypeButtons = true) => {
      const rows = [];
      
      // Boutons de navigation des pages
      if (totalPages > 1) {
        const navRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('first_page')
            .setLabel('⏪')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('prev_page')
            .setLabel('◀️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel('▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1),
          new ButtonBuilder()
            .setCustomId('last_page')
            .setLabel('⏩')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1)
        );
        rows.push(navRow);
      }

      // Boutons de type de classement
      if (showTypeButtons) {
        const typeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('global_leaderboard')
            .setLabel('🏆 Global')
            .setStyle(currentType === 'global' ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('server_leaderboard')
            .setLabel('🏟️ Serveur')
            .setStyle(currentType === 'server' ? ButtonStyle.Primary : ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('clan_leaderboard')
            .setLabel('🏛️ Clans')
            .setStyle(currentType === 'clans' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );
        rows.push(typeRow);
      }

      return rows;
    };

    // Fonction pour obtenir les données selon le type
    const getData = async (type, page) => {
      switch (type) {
        case 'global':
          const globalUsers = await User.find().sort({ elo: -1 });
          const embed = createGlobalLeaderboard(globalUsers, page);
          const totalPages = Math.ceil(globalUsers.length / 10);
          return { embed, totalPages };

        case 'server':
          // Récupérer les membres du serveur actuel
          const guild = interaction.guild;
          const serverMembers = await guild.members.fetch();
          const serverUserIds = serverMembers.map(member => member.user.id);
          const serverUsers = await User.find({ userId: { $in: serverUserIds } }).sort({ elo: -1 });
          const serverEmbed = await createServerLeaderboard(serverUsers, guild.name, page);
          const serverTotalPages = Math.ceil(serverUsers.length / 10);
          return { embed: serverEmbed, totalPages: serverTotalPages };

        case 'clans':
          const clans = await Clan.find().populate('members').sort({ elo: -1 });
          const clanEmbed = await createClanLeaderboard(clans, page);
          const clanTotalPages = Math.ceil(clans.length / 10);
          return { embed: clanEmbed, totalPages: clanTotalPages };

        default:
          return getData('global', page);
      }
    };

    // Obtenir les données initiales
    const { embed: initialEmbed, totalPages } = await getData(currentType, currentPage);
    const components = createButtons(currentPage, totalPages);

    const response = await interaction.reply({
      embeds: [initialEmbed],
      components: components,
      fetchReply: true
    });

    // Collector pour les interactions avec les boutons
    const collector = response.createMessageComponentCollector({
      time: 300000 // 5 minutes
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: '❌ Seul l\'utilisateur qui a lancé la commande peut naviguer.', ephemeral: true });
      }

      await i.deferUpdate();

      // Gestion des boutons de navigation
      if (i.customId === 'first_page') {
        currentPage = 0;
      } else if (i.customId === 'prev_page') {
        currentPage = Math.max(0, currentPage - 1);
      } else if (i.customId === 'next_page') {
        currentPage += 1;
      } else if (i.customId === 'last_page') {
        const { totalPages: maxPages } = await getData(currentType, 0);
        currentPage = Math.max(0, maxPages - 1);
      }
      // Gestion des boutons de type
      else if (i.customId === 'global_leaderboard') {
        currentType = 'global';
        currentPage = 0;
      } else if (i.customId === 'server_leaderboard') {
        currentType = 'server';
        currentPage = 0;
      } else if (i.customId === 'clan_leaderboard') {
        currentType = 'clans';
        currentPage = 0;
      }

      // Mettre à jour l'affichage
      const { embed: newEmbed, totalPages: newTotalPages } = await getData(currentType, currentPage);
      const newComponents = createButtons(currentPage, newTotalPages);

      await i.editReply({
        embeds: [newEmbed],
        components: newComponents
      });
    });

    collector.on('end', () => {
      // Désactiver tous les boutons après expiration
      const disabledComponents = components.map(row => {
        const newRow = new ActionRowBuilder();
        row.components.forEach(button => {
          newRow.addComponents(ButtonBuilder.from(button).setDisabled(true));
        });
        return newRow;
      });

      interaction.editReply({ components: disabledComponents }).catch(() => {});
    });
  }
};
