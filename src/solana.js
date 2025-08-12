import { 
    Connection, 
    Keypair, 
    PublicKey, 
    Transaction, 
    TransactionInstruction,
    SystemProgram,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import bs58 from 'bs58';
import { config } from './config.js';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

class SolanaService {
    constructor() {
        this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
        this.wallet = this.loadWallet();
    }

    loadWallet() {
        try {
            const secretKey = bs58.decode(config.solana.privateKey);
            return Keypair.fromSecretKey(secretKey);
        } catch (error) {
            console.error('Error loading wallet:', error);
            throw new Error('Invalid private key format');
        }
    }

    async getBalance() {
        try {
            const balance = await this.connection.getBalance(this.wallet.publicKey);
            return balance / LAMPORTS_PER_SOL;
        } catch (error) {
            console.error('Error getting balance:', error);
            throw error;
        }
    }

    isValidSolanaAddress(address) {
        try {
            const pubkey = new PublicKey(address);
            return PublicKey.isOnCurve(pubkey.toBuffer());
        } catch {
            return false;
        }
    }

    async sendMemoWithTransfer(recipientAddress, message, amountInSol = 0.000001) {
        try {
            if (!this.isValidSolanaAddress(recipientAddress)) {
                return {
                    success: false,
                    error: 'Invalid recipient address'
                };
            }

            const recipientPubkey = new PublicKey(recipientAddress);
            const transaction = new Transaction();
            
            // Add transfer instruction (minimal amount)
            const transferInstruction = SystemProgram.transfer({
                fromPubkey: this.wallet.publicKey,
                toPubkey: recipientPubkey,
                lamports: Math.floor(amountInSol * LAMPORTS_PER_SOL)
            });
            transaction.add(transferInstruction);
            
            // Add bot signature to message
            const fullMessage = `${message}\n\nSent by https://t.me/sol_messaging_bot`;
            
            // Add memo instruction with signature
            const memoInstruction = new TransactionInstruction({
                keys: [
                    {
                        pubkey: this.wallet.publicKey,
                        isSigner: true,
                        isWritable: true
                    }
                ],
                data: Buffer.from(fullMessage, 'utf-8'),
                programId: MEMO_PROGRAM_ID
            });
            transaction.add(memoInstruction);

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.wallet],
                {
                    commitment: 'confirmed'
                }
            );

            return {
                success: true,
                signature,
                recipient: recipientAddress,
                message: message,
                amount: amountInSol,
                explorerUrl: `https://solscan.io/tx/${signature}`
            };
        } catch (error) {
            console.error('Error sending memo with transfer:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async checkTransaction(signature) {
        try {
            const status = await this.connection.getSignatureStatus(signature);
            return status.value;
        } catch (error) {
            console.error('Error checking transaction:', error);
            return null;
        }
    }

    getWalletAddress() {
        return this.wallet.publicKey.toString();
    }
}

export default new SolanaService();