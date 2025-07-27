# MMA Discord Bot

This project is an inter-server MMA combat bot for Discord, built with **discord.js** and **MongoDB**.

## Features

- Matchmaking with `/fight`
- User profiles with Elo and statistics using `/profile`
- Clan system with `/clan`
- Economy commands like `/balance`
- Premium and admin commands

## Installation

1. Install Node.js 20.
2. Copy `.env.example` to `.env` and fill in your bot token and MongoDB URI.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the bot:
   ```bash
   node index.js
   ```

## Notes

The project contains basic implementations as a starting point and does not cover the entire specification. Further development is required to implement full combat mechanics and matchmaking logic.
