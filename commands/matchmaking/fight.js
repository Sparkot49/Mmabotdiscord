const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
    await User.findOneAndUpdate({ userId: winnerId }, { $inc: { wins: 1, elo: 10, money: 50 } }, { upsert: true });
    await User.findOneAndUpdate({ userId: loserId }, { $inc: { losses: 1, elo: -10, money: -20 } }, { upsert: true });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fight')
    .setDescription('Entrer dans la file d\'attente pour combattre'),
  async execute(interaction) {
    queue.push({ user: interaction.user });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('fight_ai').setLabel('Jouer contre une IA').setStyle(ButtonStyle.Primary)
    );
    const reply = await interaction.reply({ content: 'Ajout\u00e9 \u00e0 la file d\'attente.', components: [row], ephemeral: true, fetchReply: true });

    const collector = reply.createMessageComponentCollector({ filter: i => i.customId === 'fight_ai' && i.user.id === interaction.user.id, time: 15000 });
    collector.on('collect', async i => {
      const idx = queue.findIndex(q => q.user.id === interaction.user.id);
      if (idx !== -1) queue.splice(idx, 1);
      await i.update({ content: 'D\u00e9but du combat contre l\'IA...', components: [] });
      await startFight(interaction.user, { id: 'ai', username: 'IA' }, interaction.channel, { p2AI: true });
      collector.stop();
    });

    collector.on('end', () => reply.edit({ components: [] }).catch(() => {}));

    await processQueue(interaction.channel);
  }
};
