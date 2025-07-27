const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const ACTIONS = {
  quick: { cost: 5, success: 0.7, dmg: 5, label: '⚡ Attaque rapide (-5)', emoji: '⚡', description: '-5 mana' },
  power: { cost: 10, success: 0.5, dmg: 10, label: '💥 Attaque puissante (-10)', emoji: '💥', description: '-10 mana' },
  dodge: { cost: 5, success: 0.6, dmg: 0, label: '🛡️ Esquive (-5)', emoji: '🛡️', description: '-5 mana' },
  mana: { cost: 0, success: 1, dmg: 0, label: '✨ Récupérer mana (+10)', emoji: '✨', description: '+10 mana' }
};

const FIGHT_COLORS = {
  default: 0x3498db,
  damage: 0xe74c3c,
  dodge: 0xf39c12,
  mana: 0x9b59b6,
  victory: 0x2ecc71,
  defeat: 0x95a5a6
};

function randomAction() {
  const keys = Object.keys(ACTIONS);
  return keys[Math.floor(Math.random() * keys.length)];
}

function getHealthBar(hp, maxHp = 30) {
  const percentage = hp / maxHp;
  const barLength = 10;
  const filledBars = Math.floor(percentage * barLength);
  const emptyBars = barLength - filledBars;
  
  let healthColor = '🟢'; // Green
  if (percentage <= 0.3) healthColor = '🔴'; // Red
  else if (percentage <= 0.6) healthColor = '🟡'; // Yellow
  
  return healthColor.repeat(filledBars) + '⚫'.repeat(emptyBars);
}

function getManaBar(mana, maxMana = 30) {
  const percentage = mana / maxMana;
  const barLength = 8;
  const filledBars = Math.floor(percentage * barLength);
  const emptyBars = barLength - filledBars;
  
  return '🔵'.repeat(filledBars) + '⚪'.repeat(emptyBars);
}

function createFightStatusEmbed(p1, p2, title = "Combat en cours", color = FIGHT_COLORS.default, result = null, round = 1) {
  const embed = new EmbedBuilder()
    .setTitle(`🥊 ${title}`)
    .setColor(color)
    .addFields([
      {
        name: `${p1.user.username} ${p1.dodging ? '🛡️' : ''} ${p1.boostActive ? '⚡' : ''}`,
        value: `❤️ **HP:** ${p1.hp}/30 ${getHealthBar(p1.hp)}\n💙 **Mana:** ${p1.mana}/30 ${getManaBar(p1.mana)}`,
        inline: true
      },
      {
        name: '⚔️',
        value: '**VS**',
        inline: true
      },
      {
        name: `${p2.user.username} ${p2.dodging ? '🛡️' : ''} ${p2.boostActive ? '⚡' : ''}`,
        value: `❤️ **HP:** ${p2.hp}/30 ${getHealthBar(p2.hp)}\n💙 **Mana:** ${p2.mana}/30 ${getManaBar(p2.mana)}`,
        inline: true
      }
    ]);

  if (result) {
    embed.addFields([
      {
        name: `📝 Tour ${round}`,
        value: result,
        inline: false
      }
    ]);
  }

  embed.setTimestamp();
  return embed;
}

function createActionResultEmbed(result, p1, p2, actionType) {
  let color = FIGHT_COLORS.default;
  let icon = '⚔️';

  if (result.includes('touche')) {
    color = FIGHT_COLORS.damage;
    icon = '💥';
  } else if (result.includes('esquive')) {
    color = FIGHT_COLORS.dodge;
    icon = '🛡️';
  } else if (result.includes('mana')) {
    color = FIGHT_COLORS.mana;
    icon = '✨';
  }

  const embed = new EmbedBuilder()
    .setTitle(`${icon} Action du tour`)
    .setDescription(`**${result}**`)
    .setColor(color)
    .addFields([
      {
        name: `${p1.user.username}`,
        value: `❤️ ${p1.hp}/30 ${getHealthBar(p1.hp)}\n💙 ${p1.mana}/30 ${getManaBar(p1.mana)}`,
        inline: true
      },
      {
        name: '⚔️',
        value: '**VS**',
        inline: true
      },
      {
        name: `${p2.user.username}`,
        value: `❤️ ${p2.hp}/30 ${getHealthBar(p2.hp)}\n💙 ${p2.mana}/30 ${getManaBar(p2.mana)}`,
        inline: true
      }
    ])
    .setTimestamp();

  return embed;
}

function createVictoryEmbed(winner, loser) {
  const embed = new EmbedBuilder()
    .setTitle('🏆 VICTOIRE !')
    .setDescription(`**${winner.user.username}** remporte le combat !`)
    .setColor(FIGHT_COLORS.victory)
    .addFields([
      {
        name: '🥇 Vainqueur',
        value: `${winner.user.username}\n❤️ **HP restants:** ${winner.hp}/30`,
        inline: true
      },
      {
        name: '💀 Vaincu',
        value: `${loser.user.username}\n❤️ **HP:** 0/30`,
        inline: true
      }
    ])
    .setThumbnail('https://cdn.discordapp.com/emojis/1234567890123456789.png') // Optionnel: ajouter une image de trophée
    .setTimestamp();

  return embed;
}

async function askAction(player, channel, opponent, actionMessage) {
  if (player.isAI) return randomAction();

  // Créer l'embed pour demander l'action
  const isCurrentUser = player.user.id === channel.lastInteraction?.user?.id;
  const titleText = isCurrentUser ? 'À ton tour !' : `Au tour de : ${player.user.username}`;
  
  const embed = new EmbedBuilder()
    .setTitle(titleText)
    .setDescription('Choisis ton action pour ce tour !')
    .setColor(FIGHT_COLORS.default)
    .addFields([
      {
        name: 'Tes statistiques',
        value: `❤️ **HP:** ${player.hp}/30 ${getHealthBar(player.hp)}\n💙 **Mana:** ${player.mana}/30 ${getManaBar(player.mana)}`,
        inline: true
      },
      {
        name: 'Adversaire',
        value: `❤️ **HP:** ${opponent.hp}/30 ${getHealthBar(opponent.hp)}\n💙 **Mana:** ${opponent.mana}/30 ${getManaBar(opponent.mana)}`,
        inline: true
      }
    ])
    .setFooter({ text: 'Tu as 10 secondes pour choisir !' })
    .setTimestamp();

  // Ajouter les boutons de consommables si le joueur en a
  const rows = [];
  
  // Première rangée : actions normales
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quick')
      .setLabel(ACTIONS.quick.label)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(player.mana < ACTIONS.quick.cost),
    new ButtonBuilder()
      .setCustomId('power')
      .setLabel(ACTIONS.power.label)
      .setStyle(ButtonStyle.Danger)
      .setDisabled(player.mana < ACTIONS.power.cost),
    new ButtonBuilder()
      .setCustomId('dodge')
      .setLabel(ACTIONS.dodge.label)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(player.mana < ACTIONS.dodge.cost),
    new ButtonBuilder()
      .setCustomId('mana')
      .setLabel(ACTIONS.mana.label)
      .setStyle(ButtonStyle.Success)
  );
  rows.push(actionRow);

  // Deuxième rangée : consommables (si disponibles)
  if (player.consumables && Object.values(player.consumables).some(count => count > 0)) {
    const consumableRow = new ActionRowBuilder();
    
    if (player.consumables.healthPotion > 0) {
      consumableRow.addComponents(
        new ButtonBuilder()
          .setCustomId('use_health_potion')
          .setLabel(`🧪 Potion soin (${player.consumables.healthPotion})`)
          .setStyle(ButtonStyle.Success)
      );
    }
    
    if (player.consumables.manaPotion > 0) {
      consumableRow.addComponents(
        new ButtonBuilder()
          .setCustomId('use_mana_potion')
          .setLabel(`🔮 Potion mana (${player.consumables.manaPotion})`)
          .setStyle(ButtonStyle.Primary)
      );
    }
    
    if (player.consumables.boostPotion > 0) {
      consumableRow.addComponents(
        new ButtonBuilder()
          .setCustomId('use_boost_potion')
          .setLabel(`⚡ Boost x2 (${player.consumables.boostPotion})`)
          .setStyle(ButtonStyle.Danger)
      );
    }
    
    if (consumableRow.components.length > 0) {
      rows.push(consumableRow);
    }
  }

  // Si c'est le premier tour ou nouveau joueur, créer le message
  if (!actionMessage || actionMessage.author.id !== player.user.id) {
    if (actionMessage) {
      try {
        await actionMessage.delete();
      } catch (error) {
        // Ignorer l'erreur si le message est déjà supprimé
      }
    }
    
    actionMessage = await channel.send({ 
      content: `<@${player.user.id}>`, 
      embeds: [embed], 
      components: rows 
    });
  } else {
    // Mettre à jour le message existant
    await actionMessage.edit({ 
      content: `<@${player.user.id}>`, 
      embeds: [embed], 
      components: rows 
    });
  }

  try {
    const interaction = await actionMessage.awaitMessageComponent({ 
      filter: i => i.user.id === player.user.id, 
      time: 10000 
    });
    
    await interaction.deferUpdate();
    return { action: interaction.customId, actionMessage };
  } catch (err) {
    return { action: 'mana', actionMessage };
  }
}

function applyAction(action, actor, opponent) {
  const data = ACTIONS[action];
  const actorName = actor.user ? actor.user.username : 'IA';
  
  // Gestion des consommables
  if (action.startsWith('use_')) {
    return useConsumable(action, actor);
  }
  
  if (actor.mana < data.cost) {
    return `${actorName} n'a pas assez de mana pour ${data.label}.`;
  }
  
  // Appliquer le boost si actif
  let actualCost = data.cost;
  let actualDamage = data.dmg;
  
  if (actor.boostActive) {
    actualCost *= 2;
    actualDamage *= 2;
    actor.boostActive = false; // Le boost ne dure qu'un tour
  }
  
  actor.mana -= actualCost;
  
  if (action === 'mana') {
    const manaGain = actor.boostActive ? 20 : 10;
    actor.mana = Math.min(actor.mana + manaGain, 30);
    return `${actorName} récupère ${manaGain} points de mana ! ✨`;
  }
  
  if (action === 'dodge') {
    actor.dodging = Math.random() < data.success;
    return actor.dodging 
      ? `${actorName} se prépare à esquiver la prochaine attaque ! 🛡️` 
      : `${actorName} rate sa préparation d'esquive... 😵`;
  }
  
  if (Math.random() < data.success) {
    if (!opponent.dodging) {
      opponent.hp -= actualDamage;
      const boostText = actualDamage > data.dmg ? ' **BOOST x2!**' : '';
      return `${actorName} ${action === 'quick' ? 'frappe rapidement' : 'porte un coup puissant'} et inflige **${actualDamage} dégâts** !${boostText} 💥`;
    }
    return `${opponent.user.username} esquive brillamment l'attaque ! 🛡️✨`;
  }
  
  return `${actorName} rate son attaque... 😞`;
}

function useConsumable(action, actor) {
  const actorName = actor.user ? actor.user.username : 'IA';
  
  switch (action) {
    case 'use_health_potion':
      if (actor.consumables.healthPotion > 0) {
        actor.consumables.healthPotion--;
        actor.hp = Math.min(actor.hp + 10, 30);
        return `${actorName} utilise une potion de soin et récupère 10 HP ! 🧪`;
      }
      break;
      
    case 'use_mana_potion':
      if (actor.consumables.manaPotion > 0) {
        actor.consumables.manaPotion--;
        actor.mana = Math.min(actor.mana + 10, 30);
        return `${actorName} utilise une potion de mana et récupère 10 mana ! 🔮`;
      }
      break;
      
    case 'use_boost_potion':
      if (actor.consumables.boostPotion > 0) {
        actor.consumables.boostPotion--;
        actor.boostActive = true;
        return `${actorName} utilise un boost ! Toutes les actions sont doublées ce tour ! ⚡`;
      }
      break;
  }
  
  return `${actorName} ne peut pas utiliser cet objet.`;
}

async function startFight(p1User, p2User, channel, options = {}) {
  const User = require('./models/User');
  
  // Récupérer les données des joueurs depuis la base de données
  const p1Data = await User.findOne({ userId: p1User.id }) || {};
  const p2Data = await User.findOne({ userId: p2User.id }) || {};
  
  const p1 = { 
    user: p1User, 
    hp: 30, 
    mana: 30, 
    dodging: false, 
    boostActive: false,
    isAI: !!options.p1AI,
    consumables: p1Data.consumables || { healthPotion: 0, manaPotion: 0, boostPotion: 0 }
  };
  
  const p2 = { 
    user: p2User, 
    hp: 30, 
    mana: 30, 
    dodging: false, 
    boostActive: false,
    isAI: !!options.p2AI,
    consumables: p2Data.consumables || { healthPotion: 0, manaPotion: 0, boostPotion: 0 }
  };

  // Embed principal du combat - s'actualise à chaque tour
  const fightEmbed = createFightStatusEmbed(p1, p2, "DÉBUT DU COMBAT !", FIGHT_COLORS.default);
  fightEmbed.setDescription(`Le combat commence entre **${p1.user.username}** et **${p2.user.username}** !\n\n*Que le meilleur gagne !*`);
  
  let fightMessage = await channel.send({ embeds: [fightEmbed] });
  let actionMessage = null; // Message unique pour les actions

  let attacker = p1;
  let defender = p2;
  let round = 1;

  while (p1.hp > 0 && p2.hp > 0) {
    attacker.dodging = false;
    
    const { action, actionMessage: newActionMessage } = await askAction(attacker, channel, defender, actionMessage);
    actionMessage = newActionMessage;
    
    const result = applyAction(action, attacker, defender);
    
    // Mettre à jour l'embed principal avec le résultat de l'action
    const updatedEmbed = createFightStatusEmbed(p1, p2, "Combat en cours", FIGHT_COLORS.default, result, round);
    await fightMessage.edit({ embeds: [updatedEmbed] });
    
    if (defender.hp <= 0) break;
    
    [attacker, defender] = [defender, attacker];
    round++;
    
    // Petite pause pour la lisibilité
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Supprimer le message d'actions à la fin du combat
  if (actionMessage) {
    try {
      await actionMessage.delete();
    } catch (error) {
      // Ignorer les erreurs de suppression
    }
  }

  const winner = p1.hp > 0 ? p1 : p2;
  const loser = p1.hp > 0 ? p2 : p1;
  
  // Sauvegarder les consommables utilisés
  if (!winner.isAI) {
    await User.findOneAndUpdate(
      { userId: winner.user.id },
      { $set: { consumables: winner.consumables } },
      { upsert: true }
    );
  }
  
  if (!loser.isAI) {
    await User.findOneAndUpdate(
      { userId: loser.user.id },
      { $set: { consumables: loser.consumables } },
      { upsert: true }
    );
  }
  
  // Embed final de victoire
  const victoryEmbed = createVictoryEmbed(winner, loser);
  await fightMessage.edit({ embeds: [victoryEmbed] });
  
  return winner.user.id;
}

module.exports = { startFight };
