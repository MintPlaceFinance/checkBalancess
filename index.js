const { ethers } = require("ethers");
const bip39 = require('bip39');
const pLimit = require('p-limit'); // Use p-limit to control concurrency

// Configure your Ethereum provider
const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/GhdsgZPon6ORoVqTh8yD0j1FgtRX1v0R");

async function checkBalance(wallet) {
    const balance = await provider.getBalance(wallet.address);
    return { balance, wallet };
}

// Function to handle the generation and checking of a single wallet
async function processWallet(limit) {
    const mnemonic = bip39.generateMnemonic();
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    const result = await limit(() => checkBalance(wallet));
    return result;
}

async function generateAndCheckWallets(numberOfWallets, concurrencyLimit) {
    const limit = pLimit(concurrencyLimit); // Limit concurrency
    let walletsChecked = 0;
    let walletsWithBalance = 0;

    const walletPromises = [];
    for (let i = 0; i < numberOfWallets; i++) {
        walletPromises.push(processWallet(limit).then(({ balance, wallet }) => {
            walletsChecked++;
            if (balance.gt(ethers.constants.Zero)) {
                walletsWithBalance++;
                console.log(`Found balance! Address: ${wallet.address}, Mnemonic: ${wallet.mnemonic.phrase}, Balance: ${ethers.utils.formatEther(balance)} ETH`);
                process.exit(0); // Optionally exit if balance found - consider your use case
            }
        }));
    }

    // Await all wallet checks to complete
    await Promise.all(walletPromises);

    // Log summary after all wallets in the batch have been processed
    console.log(`Batch completed. Wallets checked: ${walletsChecked}, Wallets with balance: ${walletsWithBalance}`);
}

// Example usage: generate and check 1000 wallets with a concurrency limit of 50
generateAndCheckWallets(1000, 50);
