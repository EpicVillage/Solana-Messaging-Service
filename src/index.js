import { validateConfig } from './config.js';
import TelegramBot from './bot.js';

async function main() {
    try {
        console.log('🚀 Starting Solana Telegram Memo Bot...');
        
        validateConfig();
        
        const bot = new TelegramBot();
        await bot.start();
        
        process.once('SIGINT', () => {
            console.log('\n👋 Shutting down gracefully...');
            bot.stop();
        });
        
        process.once('SIGTERM', () => {
            console.log('\n👋 Shutting down gracefully...');
            bot.stop();
        });
        
    } catch (error) {
        console.error('❌ Failed to start bot:', error.message);
        process.exit(1);
    }
}

main();