const ethers = require('ethers');
const bip39 = require('bip39');

// Your Alchemy API URL
const alchemyApiUrl = "https://eth-mainnet.alchemyapi.io/v2/GhdsgZPon6ORoVqTh8yD0j1FgtRX1v0R";
const provider = new ethers.providers.JsonRpcProvider(alchemyApiUrl);

async function checkBalance(wallet) {
    const balance = await provider.getBalance(wallet.address);
    return { wallet, balance };
}

async function generateAndCheckWallets(batchSize) {
    let checks = [];
    let walletsChecked = 0;

    for (let i = 0; i < batchSize; i++) {
        const mnemonic = bip39.generateMnemonic();
        const wallet = ethers.Wallet.fromMnemonic(mnemonic).connect(provider);
        checks.push(checkBalance(wallet));
    }

    const results = await Promise.all(checks);
    results.forEach(({ wallet, balance }) => {
        walletsChecked++;
        if (balance.gt(ethers.constants.Zero)) {
            console.log(`Found balance! Address: ${wallet.address}, Mnemonic: ${wallet.mnemonic.phrase}, Balance: ${ethers.utils.formatEther(balance)} ETH`);
            process.exit(0); // Exit if a balance is found
        }
    });

    // After checking a batch, log the summary and continue if no balance was found
    console.log(`Batch of ${batchSize} wallets checked. Total wallets checked: ${walletsChecked}. No balance found. Continuing...`);
    await generateAndCheckWallets(batchSize); // Recursive call to process the next batch
}

async function main() {
    const batchSize = 1000; // Adjust this to control how many wallets are checked concurrently
    try {
        await generateAndCheckWallets(batchSize);
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
        process.exit(1); // Exit with an error code if an exception occurs
    }
}

main();
