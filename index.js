const { ethers } = require("ethers");
const bip39 = require('bip39');

// Configure your Ethereum provider
const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/GhdsgZPon6ORoVqTh8yD0j1FgtRX1v0R");

async function checkBalance(wallet) {
    const balance = await provider.getBalance(wallet.address);
    return { balance, wallet };
}

async function generateAndCheckWallets(numberOfWallets) {
    const checks = [];
    for (let i = 0; i < numberOfWallets; i++) {
        const mnemonic = bip39.generateMnemonic();
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);
        checks.push(checkBalance(wallet));
    }

    for (const checkPromise of checks) {
        checkPromise.then(({ balance, wallet }) => {
            if (balance.gt(ethers.constants.Zero)) {
                console.log(`Found balance! Address: ${wallet.address}, Mnemonic: ${wallet.mnemonic}, Balance: ${ethers.utils.formatEther(balance)} ETH`);
                process.exit(0); // Exit if balance found
            }
        }).catch(error => {
            console.error(`Error checking wallet: ${error.message}`);
        });
    }

    await Promise.all(checks).then(() => {
        console.log('Finished checking all wallets with no balance found.');
    });
}

generateAndCheckWallets(1000);
