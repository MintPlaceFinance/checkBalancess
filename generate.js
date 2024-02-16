const fs = require('fs');
const ethers = require('ethers');
require('colors');

// Use the same WebSocketProvider URL
const provider = new ethers.providers.WebSocketProvider(
    'https://eth-mainnet.g.alchemy.com/v2/GhdsgZPon6ORoVqTh8yD0j1FgtRX1v0R'
);

// Function to check balance and write address with non-zero balance to file
async function checkBalanceAndWrite(address) {
    try {
        const balance = await provider.getBalance(address);
        if (!balance.isZero()) {
            console.log(`${address.bgGreen.black} has balance: ${ethers.utils.formatEther(balance).bgGreen.black}`);
            fs.appendFileSync('addresses.txt', `${address} - Balance: ${ethers.utils.formatEther(balance)} ETH\n`);
        }
    } catch (error) {
        console.error(`Error checking balance for ${address}:`, error.message);
    }
}

// Main function to process mnemonics and generate addresses
async function processMnemonics() {
    try {
        const mnemonics = fs.readFileSync('mnemonics.txt', 'utf8').split('\n');

        for (let mnemonic of mnemonics) {
            if (mnemonic.trim() === '') continue; // Skip empty lines
            try {
                const wallet = ethers.Wallet.fromMnemonic(mnemonic.trim());
                await checkBalanceAndWrite(wallet.address);
            } catch (error) {
                console.error('Error processing mnemonic:', error);
            }
        }
    } catch (error) {
        console.error('Error reading mnemonics file:', error);
    }
    console.log('Finished processing mnemonics.');
}

processMnemonics();
