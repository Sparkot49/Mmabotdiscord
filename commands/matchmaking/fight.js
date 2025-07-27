const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { startFight } = require('../../src/fightEngine');
const User = require('../../src/models/User');

const queue = [];

async function processQueue(channel) {
  if (queue.length >= 2) {
    const p1 = queue.shift();
    const p2 = queue.shift();
    
    const winnerId = await startFight(p1.user, p2.user, channel);
    
    if (winnerId !== p1.user.id && winnerId !== p2.user.id) return;
    
    const loserId = winnerId === p1.user.id ? p2.user.id : p1.user.id;
    
    // Mise à jour des statistiques avec de meilleurs rewards
    await User.findOneAndUpdate(
      { userId: winnerId }, 
      { $inc: { wins: 1, elo: 25, money: 150 } }, 
      { upsert: true }
    );
    
    await User.findOneAndUpdate(
      { userId: loserId }, 
      { $inc: { losses: 1, elo: -15, money: 50 } }, 
      { upsert: true }
    );

    // Embed des récompenses
    const rewardsEmbed = new EmbedBuilder()
      .setTitle('💰 Récompenses du combat')
      .setColor(0xf1c40f)
      .addFields([
        {
          name: '🏆 Vainqueur',
          value: `<@${winnerId}>\n+25 Elo\n+150 💰 pièces`,
          inline: true
        },
        {
          name: '💔 Vaincu',
          value: `<@${loserId}>\n-15 Elo\n+50 💰 pièces (participation)`,
          inline: true
        }
      ])
      .setFooter({ text: 'Utilise /shop buy pour acheter des consommables !' })
      .setTimestamp();

    await channel.send({ embeds: [rewardsEmbed] });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fight')
    .setDescription('Rejoindre la file d\'attente pour combattre'),
  async execute(interaction) {
    // Vérifier si l'utilisateur est déjà en file
    const existingUser = queue.find(q => q.user.id === interaction.user.id);
    if (existingUser) {
      const alreadyQueuedEmbed = new EmbedBuilder()
        .setTitle('⚠️ Déjà en file')
        .setDescription('Tu es déjà dans la file d\'attente !')
        .setColor(0xe67e22);
      
      return interaction.reply({ embeds: [alreadyQueuedEmbed], ephemeral: true });
    }

    queue.push({ user: interaction.user });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('fight_ai')
        .setLabel('🤖 Combattre une IA')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('leave_queue')
        .setLabel('❌ Quitter la file')
        .setStyle(ButtonStyle.Danger)
    );

    const queueEmbed = new EmbedBuilder()
      .setTitle('⏳ File d\'attente')
      .setDescription(`Tu as été ajouté à la file d'attente !\n\n**Joueurs en attente:** ${queue.length}`)
      .addFields([
        {
          name: '🎯 Options disponibles',
          value: '🤖 Combattre une IA d\'entraînement\n❌ Quitter la file d\'attente'
        }
      ])
      .setColor(0x3498db)
      .setFooter({ text: 'En attente d\'un adversaire...' })
      .setTimestamp();

    const reply = await interaction.reply({ 
      embeds: [queueEmbed], 
      components: [row], 
      ephemeral: true, 
      fetchReply: true 
    });

    const collector = reply.createMessageComponentCollector({ 
      filter: i => i.user.id === interaction.user.id, 
      time: 60000 
    });

    collector.on('collect', async i => {
      if (i.customId === 'fight_ai') {
        // Retirer de la file
        const idx = queue.findIndex(q => q.user.id === interaction.user.id);
        if (idx !== -1) queue.splice(idx, 1);

        const aiStartEmbed = new EmbedBuilder()
          .setTitle('🤖 Combat contre l\'IA')
          .setDescription('Préparation du combat d\'entraînement...')
          .setColor(0x9b59b6);

        await i.update({ embeds: [aiStartEmbed], components: [] });
        
        // Démarrer le combat contre l'IA
        await startFight(
          interaction.user, 
          { id: 'ai', username: 'IA d\'Entraînement' }, 
          interaction.channel, 
          { p2AI: true }
        );
        
        collector.stop();
      } else if (i.customId === 'leave_queue') {
        // Retirer de la file
        const idx = queue.findIndex(q => q.user.id === interaction.user.id);
        if (idx !== -1) queue.splice(idx, 1);

        const leaveEmbed = new EmbedBuilder()
          .setTitle('❌ File quittée')
          .setDescription('Tu as quitté la file d\'attente.')
          .setColor(0x95a5a6);

        await i.update({ embeds: [leaveEmbed], components: [] });
        collector.stop();
      }
    });

    collector.on('end', () => {
      const timeoutEmbed = new EmbedBuilder()
        .setTitle('⏰ Temps écoulé')
        .setDescription('Tu as été retiré de la file d\'attente.')
        .setColor(0x95a5a6);

      reply.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
      
      // Retirer de la file en cas de timeout
      const idx = queue.findIndex(q => q.user.id === interaction.user.id);
      if (idx !== -1) queue.splice(idx, 1);
    });

    // Traiter la file d'attente
    await processQueue(interaction.channel);
  }
};
