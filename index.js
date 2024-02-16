const { ethers } = require("ethers");
const bip39 = require('bip39');

// Configure your Ethereum provider
const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/GhdsgZPon6ORoVqTh8yD0j1FgtRX1v0R");

async function checkBalance(wallet) {
    const balance = await provider.getBalance(wallet.address);
    return { balance, wallet };
}

async function generateAndCheckWallets(numberOfWallets) {
    let walletsChecked = 0;
    let walletsWithBalance = 0;

    while (true) { // Loop indefinitely until a balance is found
        const checks = [];
        for (let i = 0; i < numberOfWallets; i++) {
            const mnemonic = bip39.generateMnemonic();
            const wallet = ethers.Wallet.fromMnemonic(mnemonic);
            checks.push(checkBalance(wallet));
        }

        // Await all checks and analyze results
        const results = await Promise.all(checks);
        results.forEach(({ balance, wallet }) => {
            walletsChecked++;
            if (balance.gt(ethers.constants.Zero)) {
                walletsWithBalance++;
                console.log(`Found balance! Address: ${wallet.address}, Mnemonic: ${wallet.mnemonic.phrase}, Balance: ${ethers.utils.formatEther(balance)} ETH`);
                process.exit(0); // Exit if balance found
            }
        });

        console.log(`Batch completed. Wallets checked: ${walletsChecked}, Wallets with balance: ${walletsWithBalance}, Wallets without balance: ${walletsChecked - walletsWithBalance}`);
        console.log('Starting another batch...');
    }
}

generateAndCheckWallets(1000);
