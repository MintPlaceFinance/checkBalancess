const { ethers } = require("ethers");
const bip39 = require('bip39');
const pLimit = require('p-limit'); // Use p-limit to control concurrency

// Dynamically import p-limit to manage concurrency in a CommonJS module
async function loadPLimit() {
    const { default: pLimit } = await import('p-limit');
    return pLimit;
}

async function checkBalance(wallet, provider) {
    const balance = await provider.getBalance(wallet.address);
    return { balance, wallet };
}

async function generateAndCheckWallets(numberOfWallets, provider) {
    const pLimit = await loadPLimit();
    const limit = pLimit(5); // Adjust the concurrency limit as needed

    let walletsChecked = 0;
    let walletsWithBalance = 0;

    while (true) {
        const checks = [];
        console.log(`Generating and checking ${numberOfWallets} wallets...`);
        for (let i = 0; i < numberOfWallets; i++) {
            const mnemonic = ethers.Wallet.createRandom().mnemonic.phrase; // Alternatively, use bip39 to generate mnemonics
            const wallet = ethers.Wallet.fromMnemonic(mnemonic);
            // Push a limited asynchronous function to checks array
            checks.push(limit(() => checkBalance(wallet, provider)));
        }

        const results = await Promise.all(checks);
        results.forEach(({ balance, wallet }) => {
            walletsChecked++;
            if (balance.gt(ethers.constants.Zero)) {
                walletsWithBalance++;
                console.log(`Found balance! Address: ${wallet.address}, Mnemonic: ${wallet.mnemonic}, Balance: ${ethers.utils.formatEther(balance)} ETH`);
                // Consider adding a process.exit(0) here if you want to stop as soon as a balance is found
            }
        });

        console.log(`Batch completed. Wallets checked: ${walletsChecked}, Wallets with balance: ${walletsWithBalance}, Wallets without balance: ${walletsChecked - walletsWithBalance}`);
        if (walletsWithBalance > 0) {
            console.log('Exiting process after finding a wallet with balance.');
            process.exit(0);
        } else {
            console.log('Starting another batch...');
        }
    }
}

async function main() {
    const { ethers } = await import('ethers');
    const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/GhdsgZPon6ORoVqTh8yD0j1FgtRX1v0R");
    await generateAndCheckWallets(1000, provider);
}

main().catch(console.error);
