const { ethers } = require("ethers");
const bip39 = require('bip39');

// Configure your Ethereum provider
const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/GhdsgZPon6ORoVqTh8yD0j1FgtRX1v0R");

async function checkWallet() {
    const mnemonic = bip39.generateMnemonic();
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    const balance = await provider.getBalance(wallet.address);

    if (balance.gt(ethers.constants.Zero)) {
        console.log(`Found balance! Address: ${wallet.address}, Mnemonic: ${mnemonic}, Balance: ${ethers.utils.formatEther(balance)} ETH`);
        process.exit(0); // Exit the process
    } else {
        console.log(`No balance. Address: ${wallet.address}, Tries: ${++tries}`);
        // Optionally add a delay or recursive call to checkWallet() for continuous checking
    }
}

let tries = 0; // To keep track of how many wallets have been checked
checkWallet();
