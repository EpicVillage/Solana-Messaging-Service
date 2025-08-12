import dotenv from 'dotenv';
dotenv.config();

export const config = {
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        ownerId: parseInt(process.env.OWNER_TELEGRAM_ID)
    },
    solana: {
        privateKey: process.env.SOLANA_PRIVATE_KEY,
        rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    },
    bot: {
        mode: process.env.BOT_MODE || 'limited'
    }
};

export const validateConfig = () => {
    if (!config.telegram.botToken) {
        throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
    if (!config.telegram.ownerId) {
        throw new Error('OWNER_TELEGRAM_ID is required');
    }
    if (!config.solana.privateKey) {
        throw new Error('SOLANA_PRIVATE_KEY is required');
    }
};