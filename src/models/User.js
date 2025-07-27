const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  elo: { type: Number, default: 1000 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  money: { type: Number, default: 0 },
  clan: { type: Schema.Types.ObjectId, ref: 'Clan', default: null },
  premium: { type: Boolean, default: false }
});

module.exports = model('User', userSchema);
