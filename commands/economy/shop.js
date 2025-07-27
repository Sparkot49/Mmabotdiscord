const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../src/models/User');

const SHOP_ITEMS = {
  healthPotion: {
    name: '🧪 Potion de Soin',
    description: 'Restaure 10 HP pendant un combat',
    price: 75,
    emoji: '🧪',
    maxStack: 5
  },
  manaPotion: {
    name: '🔮 Potion de Mana',
    description: 'Restaure 10 Mana pendant un combat',
    price: 60,
    emoji: '🔮',
    maxStack: 5
  },
  boostPotion: {
    name: '⚡ Potion de Boost',
    description: 'Double tous les effets pendant un tour (coût et dégâts x2)',
    price: 150,
    emoji: '⚡',
    maxStack: 3
  }
};

function createShopEmbed(user) {
  const embed = new EmbedBuilder()
    .setTitle('🏪 BOUTIQUE MMA')
    .setDescription('Achète des consommables pour améliorer tes performances au combat !')
    .setColor(0xf39c12)
    .setThumbnail('https://cdn.discordapp.com/emojis/1234567890123456789.png') // Optionnel
    .addFields([
      {
        name: '💰 Ton argent',
        value: `**${user.money || 0}** pièces`,
        inline: false
      }
    ])
    .setTimestamp();

  // Ajouter les items du shop
  Object.entries(SHOP_ITEMS).forEach(([key, item]) => {
    const userQuantity = user.consumables?.[key] || 0;
    const canBuy = (user.money || 0) >= item.price && userQuantity < item.maxStack;
    
    const statusText = userQuantity >= item.maxStack 
      ? '❌ Stock maximum atteint' 
      : canBuy 
        ? '✅ Disponible' 
        : '❌ Pas assez d\'argent';

    embed.addFields([
      {
        name: `${item.emoji} ${item.name} - **${item.price}** 💰`,
        value: `${item.description}\n**Possédé:** ${userQuantity}/${item.maxStack}\n**Statut:** ${statusText}`,
        inline: true
      }
    ]);
  });

  embed.setFooter({ text: 'Utilise les boutons pour acheter des objets !' });
  
  return embed;
}

function createInventoryEmbed(user) {
  const embed = new EmbedBuilder()
    .setTitle('🎒 TON INVENTAIRE')
    .setDescription('Voici tous tes consommables disponibles')
    .setColor(0x9b59b6)
    .addFields([
      {
        name: '💰 Argent',
        value: `**${user.money || 0}** pièces`,
        inline: false
      }
    ])
    .setTimestamp();

  const consumables = user.consumables || {};
  let hasItems = false;

  Object.entries(SHOP_ITEMS).forEach(([key, item]) => {
    const quantity = consumables[key] || 0;
    if (quantity > 0) {
      hasItems = true;
      embed.addFields([
        {
          name: `${item.emoji} ${item.name}`,
          value: `**Quantité:** ${quantity}/${item.maxStack}\n${item.description}`,
          inline: true
        }
      ]);
    }
  });

  if (!hasItems) {
    embed.addFields([
      {
        name: '📭 Inventaire vide',
        value: 'Tu n\'as aucun consommable. Visite la boutique pour en acheter !',
        inline: false
      }
    ]);
  }

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Boutique et inventaire')
    .addSubcommand(subcommand =>
      subcommand
        .setName('buy')
        .setDescription('Acheter des consommables'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('Voir ton inventaire')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    let user = await User.findOne({ userId: interaction.user.id });
    
    if (!user) {
      user = await User.create({ 
        userId: interaction.user.id,
        consumables: { healthPotion: 0, manaPotion: 0, boostPotion: 0 }
      });
    }

    if (!user.consumables) {
      user.consumables = { healthPotion: 0, manaPotion: 0, boostPotion: 0 };
      await user.save();
    }

    if (subcommand === 'buy') {
      const embed = createShopEmbed(user);
      
      // Créer les boutons d'achat
      const rows = [];
      const itemKeys = Object.keys(SHOP_ITEMS);
      
      // Première rangée
      const row1 = new ActionRowBuilder();
      itemKeys.slice(0, 3).forEach(key => {
        const item = SHOP_ITEMS[key];
        const userQuantity = user.consumables[key] || 0;
        const canBuy = user.money >= item.price && userQuantity < item.maxStack;
        
        row1.addComponents(
          new ButtonBuilder()
            .setCustomId(`buy_${key}`)
            .setLabel(`${item.emoji} ${item.price}💰`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!canBuy)
        );
      });
      rows.push(row1);

      // Boutons de navigation
      const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('view_inventory')
          .setLabel('🎒 Inventaire')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('refresh_shop')
          .setLabel('🔄 Actualiser')
          .setStyle(ButtonStyle.Success)
      );
      rows.push(navRow);

      const response = await interaction.reply({
        embeds: [embed],
        components: rows,
        ephemeral: true,
        fetchReply: true
      });

      // Collector pour les interactions
      const collector = response.createMessageComponentCollector({
        time: 300000 // 5 minutes
      });

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ Seul toi peux utiliser cette boutique.', ephemeral: true });
        }

        await i.deferUpdate();

        // Rafraîchir les données utilisateur
        user = await User.findOne({ userId: interaction.user.id });

        if (i.customId.startsWith('buy_')) {
          const itemKey = i.customId.replace('buy_', '');
          const item = SHOP_ITEMS[itemKey];
          
          if (!item) return;

          const userQuantity = user.consumables[itemKey] || 0;
          
          // Vérifications
          if (user.money < item.price) {
            return i.followUp({ content: '❌ Tu n\'as pas assez d\'argent !', ephemeral: true });
          }
          
          if (userQuantity >= item.maxStack) {
            return i.followUp({ content: '❌ Tu as déjà le maximum de cet objet !', ephemeral: true });
          }

          // Effectuer l'achat
          user.money -= item.price;
          user.consumables[itemKey] = (user.consumables[itemKey] || 0) + 1;
          await user.save();

          // Notification d'achat
          const purchaseEmbed = new EmbedBuilder()
            .setTitle('✅ Achat réussi !')
            .setDescription(`Tu as acheté **${item.name}** pour **${item.price}** pièces !`)
            .setColor(0x2ecc71)
            .addFields([
              {
                name: 'Nouvel inventaire',
                value: `${item.emoji} **${user.consumables[itemKey]}**/${item.maxStack}`,
                inline: true
              },
              {
                name: 'Argent restant',
                value: `💰 **${user.money}** pièces`,
                inline: true
              }
            ])
            .setTimestamp();

          await i.followUp({ embeds: [purchaseEmbed], ephemeral: true });

          // Actualiser la boutique
          const newEmbed = createShopEmbed(user);
          const newRows = [];
          
          // Recréer les boutons avec les nouvelles données
          const newRow1 = new ActionRowBuilder();
          itemKeys.slice(0, 3).forEach(key => {
            const item = SHOP_ITEMS[key];
            const userQuantity = user.consumables[key] || 0;
            const canBuy = user.money >= item.price && userQuantity < item.maxStack;
            
            newRow1.addComponents(
              new ButtonBuilder()
                .setCustomId(`buy_${key}`)
                .setLabel(`${item.emoji} ${item.price}💰`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!canBuy)
            );
          });
          newRows.push(newRow1);

          const newNavRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('view_inventory')
              .setLabel('🎒 Inventaire')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('refresh_shop')
              .setLabel('🔄 Actualiser')
              .setStyle(ButtonStyle.Success)
          );
          newRows.push(newNavRow);

          await i.editReply({ embeds: [newEmbed], components: newRows });

        } else if (i.customId === 'view_inventory') {
          const inventoryEmbed = createInventoryEmbed(user);
          
          const backRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('back_to_shop')
              .setLabel('🏪 Retour boutique')
              .setStyle(ButtonStyle.Primary)
          );

          await i.editReply({ embeds: [inventoryEmbed], components: [backRow] });

        } else if (i.customId === 'back_to_shop' || i.customId === 'refresh_shop') {
          const newEmbed = createShopEmbed(user);
          const newRows = [];
          
          const newRow1 = new ActionRowBuilder();
          itemKeys.slice(0, 3).forEach(key => {
            const item = SHOP_ITEMS[key];
            const userQuantity = user.consumables[key] || 0;
            const canBuy = user.money >= item.price && userQuantity < item.maxStack;
            
            newRow1.addComponents(
              new ButtonBuilder()
                .setCustomId(`buy_${key}`)
                .setLabel(`${item.emoji} ${item.price}💰`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!canBuy)
            );
          });
          newRows.push(newRow1);

          const newNavRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('view_inventory')
              .setLabel('🎒 Inventaire')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('refresh_shop')
              .setLabel('🔄 Actualiser')
              .setStyle(ButtonStyle.Success)
          );
          newRows.push(newNavRow);

          await i.editReply({ embeds: [newEmbed], components: newRows });
        }
      });

      collector.on('end', () => {
        // Désactiver tous les boutons après expiration
        const disabledRows = rows.map(row => {
          const newRow = new ActionRowBuilder();
          row.components.forEach(button => {
            newRow.addComponents(ButtonBuilder.from(button).setDisabled(true));
          });
          return newRow;
        });

        interaction.editReply({ components: disabledRows }).catch(() => {});
      });

    } else if (subcommand === 'inventory') {
      const inventoryEmbed = createInventoryEmbed(user);
      
      const shopRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('open_shop')
          .setLabel('🏪 Ouvrir boutique')
          .setStyle(ButtonStyle.Primary)
      );

      const response = await interaction.reply({
        embeds: [inventoryEmbed],
        components: [shopRow],
        ephemeral: true,
        fetchReply: true
      });

      const collector = response.createMessageComponentCollector({
        time: 300000 // 5 minutes
      });

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ Seul toi peux utiliser cet inventaire.', ephemeral: true });
        }

        await i.deferUpdate();

        if (i.customId === 'open_shop') {
          // Rafraîchir les données utilisateur
          user = await User.findOne({ userId: interaction.user.id });
          
          const embed = createShopEmbed(user);
          const rows = [];
          const itemKeys = Object.keys(SHOP_ITEMS);
          
          const row1 = new ActionRowBuilder();
          itemKeys.slice(0, 3).forEach(key => {
            const item = SHOP_ITEMS[key];
            const userQuantity = user.consumables[key] || 0;
            const canBuy = user.money >= item.price && userQuantity < item.maxStack;
            
            row1.addComponents(
              new ButtonBuilder()
                .setCustomId(`buy_${key}`)
                .setLabel(`${item.emoji} ${item.price}💰`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!canBuy)
            );
          });
          rows.push(row1);

          const navRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('view_inventory')
              .setLabel('🎒 Inventaire')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('refresh_shop')
              .setLabel('🔄 Actualiser')
              .setStyle(ButtonStyle.Success)
          );
          rows.push(navRow);

          await i.editReply({ embeds: [embed], components: rows });
        }
      });

      collector.on('end', () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(shopRow.components[0]).setDisabled(true)
        );
        interaction.editReply({ components: [disabledRow] }).catch(() => {});
      });
    }
  }
};