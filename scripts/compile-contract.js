const fs = require('fs');
const path = require('path');
const solc = require('solc');

// Read the contract source
const contractPath = path.join(__dirname, '../contracts/contract.sol');
const contractSource = fs.readFileSync(contractPath, 'utf8');

// Compile the contract
const input = {
  language: 'Solidity',
  sources: {
    'contract.sol': {
      content: contractSource,
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

try {
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      console.error('Compilation errors:');
      errors.forEach(error => console.error(error.formattedMessage));
      process.exit(1);
    }
  }

  const contractName = 'SimpleFlareWallet';
  const compiledContract = output.contracts['contract.sol'][contractName];

  if (!compiledContract) {
    throw new Error(`Contract ${contractName} not found in compilation output`);
  }

  // Create artifacts directory if it doesn't exist
  const artifactsDir = path.join(__dirname, '../artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  // Save ABI
  const abiPath = path.join(artifactsDir, 'contract-abi.json');
  fs.writeFileSync(abiPath, JSON.stringify(compiledContract.abi, null, 2));
  console.log(`✅ ABI generated at ${abiPath}`);

  // Save contract info
  const contractInfo = {
    abi: compiledContract.abi,
    contractName: contractName,
  };
  const infoPath = path.join(artifactsDir, 'contract-info.json');
  fs.writeFileSync(infoPath, JSON.stringify(contractInfo, null, 2));
  console.log(`✅ Contract info saved at ${infoPath}`);

} catch (error) {
  console.error('Compilation failed:', error.message);
  process.exit(1);
}

