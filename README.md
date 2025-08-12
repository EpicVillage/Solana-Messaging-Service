# Solana Telegram Memo Bot

A Telegram bot that allows users to send messages to any Solana wallet address with memo transactions.

## Features

- Send messages to any Solana wallet address with memo
- Minimal SOL transfer (0.000001 SOL) with each message
- Owner-controlled access modes (limited/public)
- User approval system for limited mode
- Transaction history tracking
- Balance checking
- Direct Solscan links for transactions

## Setup

### Prerequisites

- Node.js 16+ installed
- Telegram Bot Token (from @BotFather)
- Solana wallet with some SOL for transaction fees

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Create `.env` file from the example:
```bash
cp .env.example .env
```

3. Configure your `.env` file:
```
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
OWNER_TELEGRAM_ID=your_telegram_user_id
SOLANA_PRIVATE_KEY=your_wallet_private_key_base58
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
BOT_MODE=limited
```

### Getting Your Configuration

1. **Telegram Bot Token**: 
   - Message @BotFather on Telegram
   - Create new bot with `/newbot`
   - Copy the token

2. **Your Telegram ID**:
   - Message @userinfobot on Telegram
   - It will reply with your user ID

3. **Solana Private Key**:
   - Export from Phantom/Solflare wallet
   - Or generate new: `solana-keygen new`
   - Convert to base58 format if needed

## Running the Bot

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

## Bot Commands

### User Commands
- `/start` - Welcome message and command list
- `/send <address> <message>` - Send message to a Solana wallet
- `/balance` - Check bot wallet balance
- `/status` - Check your access status
- `/help` - Show help message

### Owner Commands
- `/mode` - Toggle between limited/public mode
- `/approve <user_id>` - Grant user access
- `/revoke <user_id>` - Remove user access
- `/users` - List approved users
- `/transactions` - View recent transactions

## Modes

- **Limited Mode**: Only owner and approved users can send messages
- **Public Mode**: Anyone can send messages

## Security Notes

- Keep your `.env` file secure and never commit it
- Use a dedicated wallet for the bot with minimal SOL
- Monitor transaction activity regularly
- Consider rate limiting in production

## Usage Example

```
/send 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZN2N2oqHVN Hello from Telegram!
```

This will:
1. Send 0.000001 SOL to the recipient address
2. Attach "Hello from Telegram!" as a memo
3. Return a transaction link to view on Solscan

## Transaction Costs

Each transaction costs approximately:
- Network fee: ~0.000005 SOL
- Transfer amount: 0.000001 SOL
- **Total: ~0.000006 SOL**

---

## Created with ❤️ by

[Epicvillage](https://github.com/Epicvillage)