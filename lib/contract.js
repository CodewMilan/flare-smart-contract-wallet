import { Contract, formatEther, parseEther } from "ethers"
import { getFlareProvider } from "./flare"

const CONTRACT_ADDRESS = "0x244c11840fC06Aa9A1b112eA28Ba52C1eEC08Cfa"

const CONTRACT_ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "from", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "Deposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "oldOwner", type: "address" },
      { indexed: false, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnerChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "Withdrawn",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "_newOwner", type: "address" }],
    name: "changeOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [], name: "deposit", outputs: [], stateMutability: "payable", type: "function" },
  {
    inputs: [
      { internalType: "address payable", name: "_to", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address payable", name: "_to", type: "address" }],
    name: "withdrawAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [], name: "getBalance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
]

/**
 * Creates a contract instance with a signer (for transactions)
 */
export function getContractWithSigner(signer) {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
}

/**
 * Creates a contract instance with a provider (for read-only operations)
 */
export function getContractWithProvider() {
  const provider = getFlareProvider()
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
}

/**
 * Get contract balance in FLR (as string)
 */
export async function getContractBalance() {
  try {
    const contract = getContractWithProvider()
    const balance = await contract.getBalance()
    return formatEther(balance)
  } catch (error) {
    console.error("Error getting contract balance:", error)
    throw error
  }
}

/**
 * Get contract owner address
 */
export async function getContractOwner() {
  try {
    const contract = getContractWithProvider()
    const owner = await contract.owner()
    return owner
  } catch (error) {
    console.error("Error getting contract owner:", error)
    throw error
  }
}

/**
 * Retry helper with exponential backoff for rate limiting
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      const isRateLimited = error?.code === -32005 || error?.data?.httpStatus === 429
      
      if (isRateLimited && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        console.warn(`Rate limited, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      throw error
    }
  }
}

/**
 * Deposit FLR to contract
 * @param {import('ethers').Signer} signer - The signer from MetaMask
 * @param {string} amount - Amount in FLR (will be converted to wei)
 */
export async function deposit(signer, amount) {
  try {
    const contract = getContractWithSigner(signer)
    
    // Retry with backoff for rate limiting
    const tx = await retryWithBackoff(async () => {
      return await contract.deposit({ value: parseEther(amount) })
    })
    
    return tx
  } catch (error) {
    // Provide user-friendly error messages
    if (error?.code === -32005 || error?.data?.httpStatus === 429) {
      const friendlyError = new Error("Network is busy. Please wait a moment and try again.")
      friendlyError.code = error.code
      friendlyError.data = error.data
      throw friendlyError
    }
    console.error("Error depositing:", error)
    throw error
  }
}

/**
 * Withdraw FLR from contract
 * @param {import('ethers').Signer} signer - The signer from MetaMask
 * @param {string} to - Recipient address
 * @param {string} amount - Amount in FLR (will be converted to wei)
 */
export async function withdraw(signer, to, amount) {
  try {
    const contract = getContractWithSigner(signer)
    
    // Retry with backoff for rate limiting
    const tx = await retryWithBackoff(async () => {
      return await contract.withdraw(to, parseEther(amount))
    })
    
    return tx
  } catch (error) {
    // Provide user-friendly error messages
    if (error?.code === -32005 || error?.data?.httpStatus === 429) {
      const friendlyError = new Error("Network is busy. Please wait a moment and try again.")
      friendlyError.code = error.code
      friendlyError.data = error.data
      throw friendlyError
    }
    console.error("Error withdrawing:", error)
    throw error
  }
}

/**
 * Withdraw all FLR from contract
 * @param {import('ethers').Signer} signer - The signer from MetaMask
 * @param {string} to - Recipient address
 */
export async function withdrawAll(signer, to) {
  try {
    const contract = getContractWithSigner(signer)
    
    // Retry with backoff for rate limiting
    const tx = await retryWithBackoff(async () => {
      return await contract.withdrawAll(to)
    })
    
    return tx
  } catch (error) {
    // Provide user-friendly error messages
    if (error?.code === -32005 || error?.data?.httpStatus === 429) {
      const friendlyError = new Error("Network is busy. Please wait a moment and try again.")
      friendlyError.code = error.code
      friendlyError.data = error.data
      throw friendlyError
    }
    console.error("Error withdrawing all:", error)
    throw error
  }
}

