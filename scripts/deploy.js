const fs = require('fs');
const path = require('path');
const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { monadTestnet } = require('viem/chains');

// Load environment variables from .env
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach((line) => {
    const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (parts) {
      let val = parts[2] || '';
      // Remove surrounding quotes if any
      if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
        val = val.substring(1, val.length - 1);
      }
      env[parts[1]] = val;
    }
  });
  return env;
}

// Write env value to .env and .env.local
function writeEnvValue(key, value) {
  const envFiles = ['.env', '.env.local'];
  envFiles.forEach((file) => {
    const envPath = path.resolve(__dirname, '../', file);
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }
    const lines = content.split('\n');
    let found = false;
    const newLines = lines.map((line) => {
      if (line.trim().startsWith(`${key}=`)) {
        found = true;
        return `${key}="${value}"`;
      }
      return line;
    });
    if (!found) {
      newLines.push(`${key}="${value}"`);
    }
    fs.writeFileSync(envPath, newLines.join('\n').trim() + '\n', 'utf8');
  });
}

// Generate a random 32-byte hex string for private key
function generatePrivateKey() {
  const chars = '0123456789abcdef';
  let key = '0x';
  for (let i = 0; i < 64; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

async function main() {
  const env = loadEnv();
  let privateKey = env.DEPLOYER_PRIVATE_KEY;

  if (!privateKey) {
    console.log('No DEPLOYER_PRIVATE_KEY found. Generating a new one...');
    privateKey = generatePrivateKey();
    writeEnvValue('DEPLOYER_PRIVATE_KEY', privateKey);
    console.log('Generated and saved DEPLOYER_PRIVATE_KEY to .env & .env.local');
  }

  const account = privateKeyToAccount(privateKey);
  const address = account.address;
  console.log(`Deployer Address: ${address}`);

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http('https://testnet-rpc.monad.xyz'),
  });

  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http('https://testnet-rpc.monad.xyz'),
  });

  // Check balance
  let balance = await publicClient.getBalance({ address });
  console.log(`Current Balance: ${Number(balance) / 1e18} MON`);

  if (balance === 0n) {
    console.log('Balance is 0. Requesting MON from Monad Testnet Faucet...');
    try {
      const response = await fetch('https://agents.devnads.com/v1/faucet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chainId: 10143,
          address: address,
        }),
      });

      const data = await response.json();
      console.log('Faucet response:', data);

      console.log('Waiting for balance to update...');
      let attempts = 0;
      while (balance === 0n && attempts < 15) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        balance = await publicClient.getBalance({ address });
        attempts++;
      }

      console.log(`Updated Balance: ${Number(balance) / 1e18} MON`);
      if (balance === 0n) {
        console.error('Faucet request succeeded but balance is still 0. Please fund the deployer address manually or retry.');
        process.exit(1);
      }
    } catch (error) {
      console.error('Faucet request failed:', error.message);
      console.log(`Please manually send some Monad Testnet MON to ${address} and re-run this script.`);
      process.exit(1);
    }
  }

  // Load contract compilation
  const contractJsonPath = path.resolve(__dirname, '../contracts/VoiceForms.json');
  if (!fs.existsSync(contractJsonPath)) {
    console.error('Compiled contract JSON not found. Run compile.js first.');
    process.exit(1);
  }

  const { abi, bytecode } = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'));

  console.log('Deploying VoiceForms contract...');
  try {
    const hash = await walletClient.deployContract({
      abi,
      bytecode: `0x${bytecode.replace(/^0x/, '')}`,
    });

    console.log(`Transaction Hash: ${hash}`);
    console.log('Waiting for transaction receipt...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const contractAddress = receipt.contractAddress;

    console.log(`\n🎉 Success! VoiceForms deployed to: ${contractAddress}`);
    writeEnvValue('NEXT_PUBLIC_CONTRACT_ADDRESS', contractAddress);
    console.log('Saved NEXT_PUBLIC_CONTRACT_ADDRESS to .env & .env.local');

  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

main();
