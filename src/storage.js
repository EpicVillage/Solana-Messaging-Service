import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '..', 'data.json');

class Storage {
    constructor() {
        this.data = this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(DATA_FILE)) {
                const rawData = fs.readFileSync(DATA_FILE, 'utf8');
                return JSON.parse(rawData);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return {
            mode: 'limited',
            approvedUsers: [],
            transactions: []
        };
    }

    saveData() {
        try {
            fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    getMode() {
        return this.data.mode;
    }

    setMode(mode) {
        this.data.mode = mode;
        this.saveData();
    }

    isUserApproved(userId) {
        return this.data.approvedUsers.includes(userId);
    }

    addApprovedUser(userId) {
        if (!this.isUserApproved(userId)) {
            this.data.approvedUsers.push(userId);
            this.saveData();
        }
    }

    removeApprovedUser(userId) {
        const index = this.data.approvedUsers.indexOf(userId);
        if (index > -1) {
            this.data.approvedUsers.splice(index, 1);
            this.saveData();
        }
    }

    getApprovedUsers() {
        return this.data.approvedUsers;
    }

    addTransaction(transaction) {
        this.data.transactions.push({
            ...transaction,
            timestamp: new Date().toISOString()
        });
        this.saveData();
    }

    getTransactions(limit = 10) {
        return this.data.transactions.slice(-limit);
    }
}

export default new Storage();