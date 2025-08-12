# Testing Guide

## Setup for Testing

### 1. Prerequisites
- Node.js 16+ installed
- Telegram account
- Solana wallet with testnet/devnet SOL

### 2. Initial Setup

#### Create a Test Bot
1. Message @BotFather on Telegram
2. Send `/newbot`
3. Choose a name (e.g., "SolanaTestMemoBot")
4. Choose a username (e.g., "solana_test_memo_bot")
5. Copy the token

#### Get Your Telegram ID
1. Message @userinfobot
2. It will reply with your user ID
3. Save this for the .env file

#### Setup Test Wallet
For testing, use Solana Devnet:

```bash
# Install Solana CLI (if not installed)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Create new test wallet
solana-keygen new --outfile test-wallet.json

# Get the address
solana-keygen pubkey test-wallet.json

# Convert to base58 private key
cat test-wallet.json
# Copy the array and convert to base58 using a tool or script

# Get free devnet SOL
solana airdrop 2 <your-address> --url devnet
```

### 3. Configure Environment

Create `.env` file:
```env
# Test Bot Token
TELEGRAM_BOT_TOKEN=your_test_bot_token

# Your Telegram ID
OWNER_TELEGRAM_ID=your_telegram_id

# Test Wallet (use devnet for testing)
SOLANA_PRIVATE_KEY=your_base58_private_key
SOLANA_RPC_URL=https://api.devnet.solana.com

# Start in limited mode for testing
BOT_MODE=limited
```

### 4. Install and Run

```bash
# Install dependencies
npm install

# Start the bot
npm start
```

## Testing Checklist

### Phase 1: Basic Functionality

#### 1. Bot Startup
- [ ] Run `npm start`
- [ ] Check console for "✅ Bot started successfully"
- [ ] Verify wallet address is displayed
- [ ] Verify balance is shown
- [ ] Verify mode is displayed

#### 2. Basic Commands
- [ ] Send `/start` - Should show welcome message
- [ ] Send `/help` - Should show help text
- [ ] Send `/balance` - Should show wallet balance
- [ ] Send `/status` - Should show your access status

### Phase 2: Message Sending

#### 3. Address Validation
- [ ] Try `/send` without parameters - Should show usage
- [ ] Try `/send invalidaddress Hello` - Should show invalid address error
- [ ] Try `/send` with only address - Should ask for message

#### 4. Send Test Message
Use a valid Solana address (you can use your own):
- [ ] Send `/send <valid_address> Test message`
- [ ] Should see "⏳ Sending message to Solana blockchain..."
- [ ] Should receive success message with transaction link
- [ ] Click the Solscan link to verify transaction

#### 5. Message Validation
- [ ] Try sending a message over 500 characters - Should show error
- [ ] Try sending special characters and emojis
- [ ] Try sending multi-line messages

### Phase 3: Access Control

#### 6. Owner Commands
As the owner:
- [ ] Send `/mode` - Should show mode selection buttons
- [ ] Click "Public" button - Mode should change
- [ ] Click "Limited" button - Mode should change back
- [ ] Send `/users` - Should show approved users list (empty initially)
- [ ] Send `/transactions` - Should show recent transactions

#### 7. User Approval (Limited Mode)
- [ ] Set mode to Limited
- [ ] From another Telegram account, message the bot
- [ ] Try `/send` - Should show "not authorized"
- [ ] From owner account: `/approve <other_user_id>`
- [ ] From other account, try `/send` again - Should work now
- [ ] From owner: `/revoke <other_user_id>`
- [ ] From other account, try `/send` - Should be denied again

#### 8. Public Mode
- [ ] Set mode to Public
- [ ] From non-owner account, try `/send` - Should work
- [ ] Verify transaction completes

### Phase 4: Error Handling

#### 9. Network Errors
- [ ] Disconnect internet briefly while sending - Should show error
- [ ] Use invalid RPC URL in .env - Bot should fail to start
- [ ] Use invalid private key - Bot should show error

#### 10. Insufficient Balance
- [ ] Try sending when wallet has < 0.000006 SOL
- [ ] Should receive appropriate error message

## Common Issues and Solutions

### Bot Not Responding
1. Check bot token is correct
2. Ensure bot is not already running elsewhere
3. Check internet connection

### Transaction Failing
1. Verify wallet has sufficient SOL
2. Check RPC URL is correct
3. For devnet, ensure using devnet RPC URL
4. Verify recipient address is valid

### Access Denied Errors
1. Verify your Telegram ID in .env
2. Check bot mode with `/status`
3. Ensure user is approved in limited mode

## Testing on Different Networks

### Devnet (Recommended for Testing)
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
```
- Get free SOL: `solana airdrop 2 <address> --url devnet`
- View transactions: https://solscan.io/?cluster=devnet

### Testnet
```env
SOLANA_RPC_URL=https://api.testnet.solana.com
```
- Get free SOL: `solana airdrop 2 <address> --url testnet`
- View transactions: https://solscan.io/?cluster=testnet

### Mainnet (Production)
```env
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```
- Requires real SOL
- View transactions: https://solscan.io/

## Performance Testing

### Load Testing
1. Send multiple messages in quick succession
2. Monitor bot response time
3. Check for rate limiting issues
4. Verify all transactions complete

### Long-Running Test
1. Leave bot running for 24 hours
2. Monitor memory usage
3. Check for connection drops
4. Verify auto-reconnection works

## Security Testing

### Input Validation
- [ ] Try SQL injection in messages
- [ ] Try script injection
- [ ] Try extremely long inputs
- [ ] Try binary data

### Access Control
- [ ] Verify non-owners can't use owner commands
- [ ] Test approval/revoke thoroughly
- [ ] Ensure mode changes are persistent

## Debugging Tips

### Enable Verbose Logging
Add to your code:
```javascript
console.log('DEBUG:', variable);
```

### Check Transaction Status
```javascript
const status = await solanaService.checkTransaction(signature);
console.log('Transaction status:', status);
```

### Monitor Solana Logs
```bash
solana logs --url devnet
```

## Ready for Production?

Before going live on mainnet:
- [ ] All tests pass on devnet
- [ ] Error handling is robust
- [ ] Rate limiting is implemented
- [ ] Wallet has sufficient SOL
- [ ] Backup of private keys exists
- [ ] Monitoring is set up
- [ ] Documentation is complete