import { Telegraf, Markup } from 'telegraf';
import { config } from './config.js';
import solanaService from './solana.js';
import storage from './storage.js';

class TelegramBot {
    constructor() {
        this.bot = new Telegraf(config.telegram.botToken);
        this.setupCommands();
        this.setupHandlers();
    }

    isOwner(ctx) {
        return ctx.from.id === config.telegram.ownerId;
    }

    canUseBot(ctx) {
        const mode = storage.getMode();
        if (mode === 'public') {
            return true;
        }
        return this.isOwner(ctx) || storage.isUserApproved(ctx.from.id);
    }

    setupCommands() {
        this.bot.command('start', (ctx) => {
            const welcomeMessage = `
🚀 **Solana Memo Bot**

Send messages to any Solana wallet with a memo!

**Commands:**
/send <address> <message> - Send message to a wallet
/balance - Check bot wallet balance
/status - Check bot status
/help - Show this help message

${this.isOwner(ctx) ? '\n**Owner Commands:**\n/mode - Toggle between limited/public mode\n/approve <user_id> - Approve a user\n/revoke <user_id> - Revoke user access\n/users - List approved users\n/transactions - View recent transactions' : ''}

Current Mode: ${storage.getMode()}
            `;
            ctx.replyWithMarkdown(welcomeMessage);
        });

        this.bot.command('help', (ctx) => {
            ctx.replyWithMarkdown(this.getHelpMessage(ctx));
        });

        this.bot.command('balance', async (ctx) => {
            try {
                const balance = await solanaService.getBalance();
                const address = solanaService.getWalletAddress();
                ctx.replyWithMarkdown(`
💰 **Wallet Info**
Address: \`${address}\`
Balance: ${balance.toFixed(4)} SOL
                `);
            } catch (error) {
                ctx.reply('❌ Error fetching balance. Please try again.');
            }
        });

        this.bot.command('status', (ctx) => {
            const mode = storage.getMode();
            const canUse = this.canUseBot(ctx);
            ctx.replyWithMarkdown(`
📊 **Bot Status**
Mode: ${mode}
Your Access: ${canUse ? '✅ Granted' : '❌ Denied'}
${this.isOwner(ctx) ? `\nApproved Users: ${storage.getApprovedUsers().length}` : ''}
            `);
        });

        this.bot.command('send', async (ctx) => {
            if (!this.canUseBot(ctx)) {
                return ctx.reply('❌ You are not authorized to use this bot.');
            }

            const args = ctx.message.text.replace('/send', '').trim().split(' ');
            
            if (args.length < 2) {
                return ctx.reply('❌ Please provide recipient address and message.\n\nUsage: /send <wallet_address> <message>\n\nExample:\n/send 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZN2N2oqHVN Hello from Telegram!');
            }

            const recipientAddress = args[0];
            const message = args.slice(1).join(' ');

            if (!solanaService.isValidSolanaAddress(recipientAddress)) {
                return ctx.reply('❌ Invalid Solana wallet address. Please provide a valid address.');
            }

            if (message.length > 450) {
                return ctx.reply('❌ Message too long. Maximum 450 characters allowed (to accommodate bot signature).');
            }

            const loadingMsg = await ctx.reply('⏳ Sending message to Solana blockchain...');

            try {
                const result = await solanaService.sendMemoWithTransfer(recipientAddress, message);
                
                if (result.success) {
                    storage.addTransaction({
                        userId: ctx.from.id,
                        username: ctx.from.username || 'Unknown',
                        recipient: recipientAddress.substring(0, 8) + '...',
                        message: message.substring(0, 50),
                        signature: result.signature
                    });

                    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
                    
                    await ctx.replyWithMarkdown(`
✅ **Message sent successfully!**

**To:** \`${recipientAddress}\`
**Message:** ${message}
**Amount:** ${result.amount} SOL
**Transaction:** [View on Solscan](${result.explorerUrl})
**Signature:** \`${result.signature}\`
                    `);
                } else {
                    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
                    ctx.reply(`❌ Failed to send message: ${result.error}`);
                }
            } catch (error) {
                await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
                ctx.reply('❌ An error occurred while sending the message.');
            }
        });

        this.bot.command('mode', (ctx) => {
            if (!this.isOwner(ctx)) {
                return ctx.reply('❌ Only the owner can change the mode.');
            }

            const keyboard = Markup.inlineKeyboard([
                [
                    Markup.button.callback('🔒 Limited', 'mode_limited'),
                    Markup.button.callback('🌍 Public', 'mode_public')
                ]
            ]);

            ctx.reply(`Current mode: ${storage.getMode()}\nSelect new mode:`, keyboard);
        });

        this.bot.command('approve', (ctx) => {
            if (!this.isOwner(ctx)) {
                return ctx.reply('❌ Only the owner can approve users.');
            }

            const userId = parseInt(ctx.message.text.replace('/approve', '').trim());
            
            if (!userId) {
                return ctx.reply('❌ Please provide a user ID. Usage: /approve <user_id>');
            }

            storage.addApprovedUser(userId);
            ctx.reply(`✅ User ${userId} has been approved.`);
        });

        this.bot.command('revoke', (ctx) => {
            if (!this.isOwner(ctx)) {
                return ctx.reply('❌ Only the owner can revoke access.');
            }

            const userId = parseInt(ctx.message.text.replace('/revoke', '').trim());
            
            if (!userId) {
                return ctx.reply('❌ Please provide a user ID. Usage: /revoke <user_id>');
            }

            storage.removeApprovedUser(userId);
            ctx.reply(`✅ User ${userId} access has been revoked.`);
        });

        this.bot.command('users', (ctx) => {
            if (!this.isOwner(ctx)) {
                return ctx.reply('❌ Only the owner can view approved users.');
            }

            const users = storage.getApprovedUsers();
            if (users.length === 0) {
                return ctx.reply('No approved users.');
            }

            const userList = users.map(id => `• ${id}`).join('\n');
            ctx.replyWithMarkdown(`**Approved Users:**\n${userList}`);
        });

        this.bot.command('transactions', (ctx) => {
            if (!this.isOwner(ctx)) {
                return ctx.reply('❌ Only the owner can view transactions.');
            }

            const transactions = storage.getTransactions();
            if (transactions.length === 0) {
                return ctx.reply('No recent transactions.');
            }

            const txList = transactions.map(tx => 
                `• @${tx.username}: "${tx.message}..." - ${new Date(tx.timestamp).toLocaleString()}`
            ).join('\n\n');

            ctx.replyWithMarkdown(`**Recent Transactions:**\n\n${txList}`);
        });
    }

    setupHandlers() {
        this.bot.action('mode_limited', (ctx) => {
            if (!this.isOwner(ctx)) {
                return ctx.answerCbQuery('❌ Unauthorized');
            }
            storage.setMode('limited');
            ctx.answerCbQuery('✅ Mode changed to Limited');
            ctx.editMessageText('✅ Bot mode changed to: Limited');
        });

        this.bot.action('mode_public', (ctx) => {
            if (!this.isOwner(ctx)) {
                return ctx.answerCbQuery('❌ Unauthorized');
            }
            storage.setMode('public');
            ctx.answerCbQuery('✅ Mode changed to Public');
            ctx.editMessageText('✅ Bot mode changed to: Public');
        });

        this.bot.on('text', (ctx) => {
            if (!ctx.message.text.startsWith('/')) {
                ctx.reply('Please use /send <address> <message> to send a message to a Solana wallet.\n\nExample: /send 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZN2N2oqHVN Hello!');
            }
        });
    }

    getHelpMessage(ctx) {
        let helpMessage = `
🚀 **Solana Memo Bot Help**

**Basic Commands:**
/send <address> <message> - Send message to wallet
/balance - Check bot wallet balance  
/status - Check your access status
/help - Show this help message

**How to use:**
1. Type /send followed by recipient wallet address and message
2. Example: /send 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZN2N2oqHVN Hello!
3. The bot sends a minimal SOL amount (0.000001) with your message
4. You'll receive a transaction link to view on Solscan

**Message Limits:**
• Maximum 450 characters per message
• Bot signature automatically added to all messages
• Each transaction costs ~0.000006 SOL (network fee + transfer)
        `;

        if (this.isOwner(ctx)) {
            helpMessage += `

**Owner Commands:**
/mode - Switch between limited/public mode
/approve <user_id> - Grant user access (limited mode)
/revoke <user_id> - Remove user access
/users - View all approved users
/transactions - View recent transactions
            `;
        }

        return helpMessage;
    }

    async start() {
        try {
            console.log('Launching Telegram bot...');
            
            // Test connection first
            const botInfo = await this.bot.telegram.getMe();
            console.log(`Connected as @${botInfo.username}`);
            
            // Launch bot with graceful stop
            this.bot.launch({
                dropPendingUpdates: true
            });
            
            console.log('✅ Bot started successfully');
            console.log(`Wallet: ${solanaService.getWalletAddress()}`);
            console.log(`Mode: ${storage.getMode()}`);
            
            // Get balance with timeout
            try {
                const balance = await Promise.race([
                    solanaService.getBalance(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Balance fetch timeout')), 5000)
                    )
                ]);
                console.log(`Balance: ${balance} SOL`);
            } catch (balanceError) {
                console.log('⚠️ Could not fetch balance:', balanceError.message);
                console.log('Bot will continue running...');
            }
            
            console.log('\n📱 Bot is ready! Message @sol_messaging_bot on Telegram');
            console.log('Press Ctrl+C to stop\n');
            
        } catch (error) {
            console.error('Failed to start bot:', error);
            process.exit(1);
        }
    }

    stop() {
        this.bot.stop('SIGINT');
    }
}

export default TelegramBot;