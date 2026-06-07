const path = require('path');
const fs = require('fs');
const solc = require('solc');

const contractPath = path.resolve(__dirname, '../contracts/VoiceForms.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'VoiceForms.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode'],
      },
    },
  },
};

console.log('Compiling contract...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  output.errors.forEach((err) => {
    console.error(err.formattedMessage);
  });
  if (output.errors.some((err) => err.severity === 'error')) {
    process.exit(1);
  }
}

const contract = output.contracts['VoiceForms.sol']['VoiceForms'];
const abi = contract.abi;
const bytecode = contract.evm.bytecode.object;

const outputPath = path.resolve(__dirname, '../contracts/VoiceForms.json');
fs.writeFileSync(
  outputPath,
  JSON.stringify({ abi, bytecode }, null, 2),
  'utf8'
);

console.log('Successfully compiled to contracts/VoiceForms.json!');
