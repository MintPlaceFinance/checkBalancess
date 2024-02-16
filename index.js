const { ethers } = require("ethers");
const bip39 = require('bip39');

// Configure your Ethereum provider
const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/YourAlchemyAPIKey");

async function checkWalletBalance() {
    // Generate a new mnemonic
    const mnemonic = bip39.generateMnemonic();
    // Create a wallet using the generated mnemonic
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    // Use the wallet address to check for balance
    const balance = await provider.getBalance(wallet.address);

    // Log the result
    if (balance.gt(ethers.constants.Zero)) {
        console.log(`Found balance! Address: ${wallet.address}, Mnemonic: ${mnemonic}, Balance: ${ethers.utils.formatEther(balance)} ETH`);
    } else {
        console.log(`No balance found. Address: ${wallet.address}, Mnemonic: ${mnemonic}`);
    }
}

checkWalletBalance();
