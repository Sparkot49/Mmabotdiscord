const { Schema, model } = require('mongoose');

const clanSchema = new Schema({
  name: { type: String, required: true, unique: true },
  elo: { type: Number, default: 0 },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = model('Clan', clanSchema);
