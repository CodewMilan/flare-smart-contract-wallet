import { Contract, formatEther, parseEther } from "ethers"
import { getFlareProvider } from "./flare"
import contractABI from "../artifacts/contract-abi.json"

const CONTRACT_ADDRESS = "0x735E060B08aB94905D50de4760c8f53594cc07F9"

/**
 * Creates a contract instance with a signer (for transactions)
 */
export function getContractWithSigner(signer) {
  return new Contract(CONTRACT_ADDRESS, contractABI, signer)
}

/**
 * Creates a contract instance with a provider (for read-only operations)
 */
export function getContractWithProvider() {
  const provider = getFlareProvider()
  return new Contract(CONTRACT_ADDRESS, contractABI, provider)
}

/**
 * Get contract balance in FLR (as string)
 * Uses provider.getBalance() directly instead of contract function for reliability
 */
export async function getContractBalance() {
  try {
    const provider = getFlareProvider()
    
    // Check if contract is deployed
    const code = await provider.getCode(CONTRACT_ADDRESS)
    if (code === "0x") {
      throw new Error(`Contract not deployed at address ${CONTRACT_ADDRESS}`)
    }
    
    const balance = await provider.getBalance(CONTRACT_ADDRESS)
    return formatEther(balance)
  } catch (error) {
    console.error("Error getting contract balance:", error)
    throw error
  }
}

/**
 * Get contract owner address
 * Includes contract deployment check
 */
export async function getContractOwner() {
  try {
    const provider = getFlareProvider()
    
    // First check if contract is deployed
    const code = await provider.getCode(CONTRACT_ADDRESS)
    if (code === "0x") {
      throw new Error(`Contract not deployed at address ${CONTRACT_ADDRESS}`)
    }
    
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
