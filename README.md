# MMA Discord Bot

This project is an inter-server MMA combat bot for Discord built with **discord.js** and **MongoDB**.

## Features

- Matchmaking with `/fight` including an option to duel an AI
- Turn based combat with HP and mana management
- User profiles with leagues, Elo and statistics using `/profile`
- Clan system with `/clan`
- Economy commands like `/balance`
- Premium and admin commands
- Global Elo leaderboard with `/leaderboard`

## Installation

1. Install Node.js 20.
2. Copy `.env.example` to `.env` and fill in your bot token and MongoDB URI.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## Notes

The bot implements a simplified combat engine. Additional features such as advanced matchmaking or consumables can be added from this base.
