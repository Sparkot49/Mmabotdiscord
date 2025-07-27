const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const ACTIONS = {
  quick: { cost: 5, success: 0.7, dmg: 5, label: 'Attaque rapide (-5 mana)' },
  power: { cost: 10, success: 0.5, dmg: 10, label: 'Attaque puissante (-10 mana)' },
  dodge: { cost: 5, success: 0.6, dmg: 0, label: 'Esquive (-5 mana)' },
  mana: { cost: 0, success: 1, dmg: 0, label: 'Récupérer mana (+10 mana)' }
};

function randomAction() {
  const keys = Object.keys(ACTIONS);
  return keys[Math.floor(Math.random() * keys.length)];
}

async function askAction(player, channel) {
  if (player.isAI) return randomAction();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('quick').setLabel(ACTIONS.quick.label).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('power').setLabel(ACTIONS.power.label).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('dodge').setLabel(ACTIONS.dodge.label).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('mana').setLabel(ACTIONS.mana.label).setStyle(ButtonStyle.Success)
  );

  const msg = await channel.send({ content: `<@${player.user.id}>, choisis une action :`, components: [row] });
  try {
    const interaction = await msg.awaitMessageComponent({ filter: i => i.user.id === player.user.id, time: 10000 });
    await interaction.deferUpdate();
    await msg.edit({ components: [] });
    return interaction.customId;
  } catch (err) {
    await msg.edit({ content: `Temps écoulé pour ${player.user.username}, récupération de mana par défaut.`, components: [] });
    return 'mana';
  }
}

function applyAction(action, actor, opponent) {
  const data = ACTIONS[action];
  if (actor.mana < data.cost) {
    return `${actor.user ? actor.user.username : 'IA'} n'a pas assez de mana pour ${action}.`;
  }
  actor.mana -= data.cost;
  if (action === 'mana') {
    actor.mana = Math.min(actor.mana + 10, 30);
    return `${actor.user ? actor.user.username : 'IA'} récupère 10 mana.`;
  }
  if (action === 'dodge') {
    actor.dodging = Math.random() < data.success;
    return actor.dodging ? `${actor.user.username} se prépare à esquiver.` : `${actor.user.username} rate son esquive.`;
  }
  if (Math.random() < data.success) {
    if (!opponent.dodging) {
      opponent.hp -= data.dmg;
      return `${actor.user ? actor.user.username : 'IA'} touche et inflige ${data.dmg} dégâts.`;
    }
    return `${opponent.user.username} esquive l'attaque !`;
  }
  return `${actor.user ? actor.user.username : 'IA'} rate son attaque.`;
}

async function startFight(p1User, p2User, channel, options = {}) {
  const p1 = { user: p1User, hp: 30, mana: 30, dodging: false, isAI: !!options.p1AI };
  const p2 = { user: p2User, hp: 30, mana: 30, dodging: false, isAI: !!options.p2AI };

  await channel.send(`Début du combat entre <@${p1.user.id}> et <@${p2.user.id}> !`);

  let attacker = p1;
  let defender = p2;

  while (p1.hp > 0 && p2.hp > 0) {
    attacker.dodging = false;
    const action = await askAction(attacker, channel);
    const result = applyAction(action, attacker, defender);
    await channel.send(result + ` (HP ${p1.user.username}: ${p1.hp}, HP ${p2.user.username}: ${p2.hp})`);
    if (defender.hp <= 0) break;
    [attacker, defender] = [defender, attacker];
  }

  const winner = p1.hp > 0 ? p1 : p2;
  await channel.send(`Victoire de <@${winner.user.id}> !`);
  return winner.user.id;
}

module.exports = { startFight };
