# 🔥 Flare Wallet

A fully functional crypto wallet for the **Flare Coston2 Testnet** with a pixel-perfect retro UI. Built with Next.js, React, Ethers.js, and MetaMask integration.

![Flare Wallet](https://img.shields.io/badge/Flare-Coston2%20Testnet-orange)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![Ethers.js](https://img.shields.io/badge/Ethers.js-6.13-blue)

## ✨ Features

### 🔐 Wallet Connection
- **MetaMask Integration**: Seamless connection with MetaMask wallet
- **Auto Network Detection**: Automatically detects and prompts to switch to Flare Coston2 testnet
- **Address Display**: Shows connected wallet address in the header

### 💼 Account Overview
- **Live Blockchain Data**: Real-time display of:
  - Wallet address
  - Wallet FLR balance
  - Smart contract balance
  - Contract owner address
  - Network status
- **Manual Refresh**: Refresh button to manually update all balances

### 💸 Transactions
- **Deposit FLR**: Send FLR from your wallet to the smart contract
- **Withdraw FLR**: Withdraw specific amounts from the contract to any address
- **Withdraw All**: Withdraw the entire contract balance to a recipient address
- **Transaction Status**: Real-time feedback with success, error, and pending states

### 🛡️ Error Handling
- **Rate Limiting Protection**: Automatic retry with exponential backoff
- **Network Error Recovery**: Graceful handling of RPC rate limits
- **User-Friendly Messages**: Clear error messages instead of technical jargon

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **MetaMask** browser extension installed
- **Flare Coston2 Testnet** added to MetaMask (auto-prompted on first connection)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd simplewallet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## 📖 Usage Guide

### Connecting Your Wallet

1. Click the **"Connect Wallet"** button in the header
2. Approve the MetaMask connection request
3. If you're on the wrong network, click **"Switch Network"** to automatically switch to Flare Coston2
4. Your wallet address will appear in the header once connected

### Viewing Account Information

1. Click the **"Account"** button in the header to open the Account Overview window
2. View your:
   - Wallet address
   - Current FLR balance
   - Contract balance
   - Contract owner
   - Network status
3. Click the **Refresh** button to manually update all balances

### Depositing FLR

1. Open the **"Transactions"** window (click "Transactions" in the header)
2. In the **Deposit FLR** section:
   - Enter the amount of FLR you want to deposit
   - Click **"Deposit"**
   - Approve the transaction in MetaMask
3. Wait for confirmation - you'll see a success message when complete

### Withdrawing FLR

1. Open the **"Transactions"** window
2. In the **Send FLR** section:
   - Enter the recipient address
   - Enter the amount to withdraw
   - Click **"Send"**
   - Approve the transaction in MetaMask
3. Wait for confirmation

### Withdrawing All FLR

1. Open the **"Transactions"** window
2. In the **Withdraw All** section:
   - Enter the recipient address
   - Click **"Withdraw All"**
   - Approve the transaction in MetaMask
3. The entire contract balance will be sent to the recipient

## 🏗️ Project Structure

```
simplewallet/
├── app/
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Root layout
│   └── globals.css        # Global styles
├── artifacts/
│   └── contract-abi.json # Generated ABI from contract.sol
├── components/
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── window-frame.tsx  # Draggable window component
│   └── chat-panel.tsx    # Chat/transaction panel
├── contracts/
│   └── contract.sol      # Smart contract source code (actively used)
├── hooks/
│   ├── useWallet.js      # Wallet connection and management
│   └── useContract.js    # Smart contract interactions
├── lib/
│   ├── flare.js          # Flare network configuration
│   └── contract.js       # Contract instance and helpers (imports ABI)
├── scripts/
│   └── compile-contract.js # Compiles contract.sol to generate ABI
├── styles/
│   └── habbo.module.css  # Pixel-art CSS styles
└── public/               # Static assets
```

## 🔧 Technical Details

### Smart Contract

- **Address**: `0x735E060B08aB94905D50de4760c8f53594cc07F9`
- **Network**: Flare Coston2 Testnet (Chain ID: 114)
- **RPC URL**: `https://coston2-api.flare.network/ext/C/rpc`
- **Contract Source**: Located in `contracts/contract.sol` (actively used)
- **ABI Generation**: Automatically generated from `contract.sol` to `artifacts/contract-abi.json`
- **Block Explorer**: [View Contract](https://coston2-explorer.flare.network/address/0x735E060B08aB94905D50de4760c8f53594cc07F9)

#### Contract Functions

- `deposit()` - Deposit native FLR to the contract (anyone can call)
- `withdraw(address payable _to, uint256 _amount)` - Withdraw specific amount (owner only)
- `withdrawAll(address payable _to)` - Withdraw entire balance (owner only)
- `getBalance()` - View current contract balance
- `owner()` - View contract owner address
- `changeOwner(address _newOwner)` - Change contract owner (owner only)
- `receive()` - Fallback function to accept plain FLR transfers

#### Contract Compilation

The contract ABI is automatically generated from `contracts/contract.sol`:

1. **Edit the contract**: Modify `contracts/contract.sol`
2. **Compile**: Run `npm run compile:contract` to generate the ABI
3. **Auto-compilation**: The ABI is automatically generated when running `npm run dev` or `npm run build`

The generated ABI is stored in `artifacts/contract-abi.json` and imported by `lib/contract.js`.

### Key Technologies

- **Next.js 15**: React framework with App Router
- **React 19**: UI library
- **Ethers.js v6**: Blockchain interaction library
- **MetaMask**: Wallet provider
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type safety

### Network Configuration

The wallet is configured for Flare Coston2 testnet:
- **Chain ID**: 114 (0x72)
- **Currency**: FLR
- **Block Explorer**: [Coston2 Explorer](https://coston2-explorer.flare.network)

### Rate Limiting

The app includes intelligent rate limiting protection:
- Automatic retry with exponential backoff (2s, 4s, 8s delays)
- Graceful error handling for 429 (rate limit) errors
- Reduced polling frequency (20s for balances, 15s for contract state)
- Manual refresh option when automatic updates fail

## 🐛 Troubleshooting

### "Install MetaMask" Button Shows

**Solution**: Install the [MetaMask browser extension](https://metamask.io/download/)

### "Wrong Network" Warning

**Solution**: Click the **"Switch Network"** button to automatically switch to Flare Coston2

### Rate Limiting Errors

**Symptoms**: "Network is busy" messages or failed balance fetches

**Solutions**:
1. Wait a few seconds and click the **Refresh** button
2. The app will automatically retry with backoff
3. Reduce transaction frequency if possible

### Transaction Not Showing

**Solutions**:
1. Check MetaMask for pending transactions
2. Click the **Refresh** button in Account Overview
3. Wait a few seconds - transactions may take time to confirm
4. Check the transaction on [Coston2 Explorer](https://coston2-explorer.flare.network)
5. View your contract: [0x735E060B08aB94905D50de4760c8f53594cc07F9](https://coston2-explorer.flare.network/address/0x735E060B08aB94905D50de4760c8f53594cc07F9)

### Balance Not Updating

**Solutions**:
1. Click the **Refresh** button manually
2. Wait for the next automatic refresh (15-20 seconds)
3. Check your internet connection
4. If rate limited, wait a moment and try again

## 🔒 Security Notes

- This is a **testnet wallet** - do not use with mainnet funds
- Always verify transaction details in MetaMask before approving
- Never share your private keys or seed phrases
- The smart contract address is hardcoded - verify it matches your contract

## 📝 Development

### Available Scripts

- `npm run dev` - Compile contract and start development server
- `npm run build` - Compile contract and build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run compile:contract` - Compile `contracts/contract.sol` and generate ABI

### Adding New Features

1. **Wallet Features**: Modify `hooks/useWallet.js`
2. **Contract Features**: Modify `hooks/useContract.js` and `lib/contract.js`
3. **Smart Contract**: 
   - Edit `contracts/contract.sol`
   - Run `npm run compile:contract` to regenerate ABI
   - Redeploy the contract to update the on-chain version
4. **UI Components**: Add to `components/` directory
5. **Styling**: Use Tailwind classes or modify `styles/habbo.module.css`

### Working with the Smart Contract

The application actively uses `contracts/contract.sol` as the source of truth:

1. **Edit Contract**: Make changes to `contracts/contract.sol`
2. **Compile**: Run `npm run compile:contract` to generate the ABI
3. **Deploy**: Deploy the updated contract to Flare Coston2 testnet
4. **Update Address**: Update `CONTRACT_ADDRESS` in `lib/contract.js` with the new deployment address

The ABI is automatically imported from `artifacts/contract-abi.json` into `lib/contract.js`, ensuring the frontend always uses the correct interface matching your Solidity contract.

### Updating Contract Address

If you deploy a new contract, update the address in:
- `lib/contract.js` - Line 4: `CONTRACT_ADDRESS`
- `app/page.tsx` - Update contract address display (2 locations)
- `README.md` - Update contract address in Technical Details section

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Powered by [Flare Network](https://flare.network/)

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**⚠️ Disclaimer**: This is a testnet application. Use at your own risk. Always verify transactions and contract addresses.
