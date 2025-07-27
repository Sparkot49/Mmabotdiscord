const User = require('./models/User');

module.exports = async function(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const win = Math.random() > 0.5;
  if (win) {
    await interaction.editReply('You defeated the training AI!');
  } else {
    await interaction.editReply('The training AI defeated you.');
  }
};
