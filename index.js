const { ethers } = require("ethers");
const bip39 = require('bip39');

// Configure your Ethereum provider
const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/GhdsgZPon6ORoVqTh8yD0j1FgtRX1v0R");

async function checkBalance(wallet) {
    const balance = await provider.getBalance(wallet.address);
    return { balance, wallet };
}

async function generateAndCheckWallets(numberOfWallets) {
    let found = false; // Flag to indicate if a balance has been found

    while (!found) {
        const checks = [];
        for (let i = 0; i < numberOfWallets; i++) {
            const mnemonic = bip39.generateMnemonic();
            const wallet = ethers.Wallet.fromMnemonic(mnemonic);
            checks.push(checkBalance(wallet).then(({ balance, wallet }) => {
                if (balance.gt(ethers.constants.Zero)) {
                    console.log(`Found balance! Address: ${wallet.address}, Mnemonic: ${wallet.mnemonic}, Balance: ${ethers.utils.formatEther(balance)} ETH`);
                    found = true; // Set found to true to break the loop
                }
            }));
        }

        await Promise.all(checks).then(() => {
            if (!found) {
                console.log('Finished checking a batch of wallets with no balance found. Starting another batch...');
            }
        });

        if (found) {
            console.log('Exiting process after finding a wallet with balance.');
            process.exit(0); // Exit if balance found
        }
    }
}

generateAndCheckWallets(1000);
