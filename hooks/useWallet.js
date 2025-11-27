"use client"

import { useState, useEffect, useCallback } from "react"
import { BrowserProvider } from "ethers"
import { FLARE_NETWORK, FLARE_METAMASK_CONFIG } from "@/lib/flare"

/**
 * Hook for managing MetaMask wallet connection
 */
export function useWallet() {
  const [address, setAddress] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [chainId, setChainId] = useState(null)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)

  // Check if MetaMask is installed (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setIsMetaMaskInstalled(typeof window !== "undefined" && typeof window.ethereum !== "undefined")
  }, [])

  // Initialize provider and check connection on mount
  useEffect(() => {
    if (!isMetaMaskInstalled) return

    const init = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum)
        setProvider(provider)

        // Check if already connected
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          const signer = await provider.getSigner()
          const network = await provider.getNetwork()
          const address = await signer.getAddress()
          const currentChainId = Number(network.chainId.toString())

          setAddress(address)
          setIsConnected(true)
          setSigner(signer)
          setChainId(currentChainId)
          setIsCorrectNetwork(currentChainId === FLARE_NETWORK.chainId)
        }
      } catch (error) {
        console.error("Error initializing wallet:", error)
      }
    }

    init()

    // Listen for account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null)
        setIsConnected(false)
        setSigner(null)
      } else {
        init()
      }
    }

    // Listen for chain changes
    const handleChainChanged = () => {
      window.location.reload()
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [isMetaMaskInstalled])

  /**
   * Switch to Flare Coston2 network
   */
  const switchNetwork = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      throw new Error("MetaMask is not installed")
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: FLARE_METAMASK_CONFIG.chainId }],
      })
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [FLARE_METAMASK_CONFIG],
          })
        } catch (addError) {
          throw new Error("Failed to add Flare Coston2 network to MetaMask")
        }
      } else {
        throw switchError
      }
    }
  }, [isMetaMaskInstalled])

  /**
   * Connect wallet
   */
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
    }

    setIsConnecting(true)
    try {
      const provider = new BrowserProvider(window.ethereum)
      setProvider(provider)

      // Request account access
      await provider.send("eth_requestAccounts", [])

      const signer = await provider.getSigner()
      const network = await provider.getNetwork()
      const address = await signer.getAddress()
      const currentChainId = Number(network.chainId.toString())

      setAddress(address)
      setIsConnected(true)
      setSigner(signer)
      setChainId(currentChainId)
      setIsCorrectNetwork(currentChainId === FLARE_NETWORK.chainId)

      // If wrong network, prompt to switch
      if (currentChainId !== FLARE_NETWORK.chainId) {
        await switchNetwork()
        // Reload after switch
        window.location.reload()
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [isMetaMaskInstalled, switchNetwork])

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setAddress(null)
    setIsConnected(false)
    setSigner(null)
    setProvider(null)
    setChainId(null)
    setIsCorrectNetwork(false)
  }, [])

  /**
   * Retry helper with exponential backoff
   */
  const retryWithBackoff = useCallback(async (fn, maxRetries = 3, baseDelay = 2000) => {
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
  }, [])

  /**
   * Get wallet balance in FLR with retry logic
   */
  const getBalance = useCallback(async () => {
    if (!provider || !address) return "0"

    try {
      const balance = await retryWithBackoff(async () => {
        return await provider.getBalance(address)
      })
      return (Number(balance) / 1e18).toFixed(4)
    } catch (error) {
      // Handle rate limiting and other errors gracefully
      if (error?.code === -32005 || error?.data?.httpStatus === 429) {
        console.warn("Rate limited after retries, will try again later")
        return null // Return null to indicate we should keep the last known balance
      }
      console.error("Error getting balance:", error)
      return null
    }
  }, [provider, address, retryWithBackoff])

  return {
    address,
    isConnected,
    isConnecting,
    chainId,
    isCorrectNetwork,
    provider,
    signer,
    isMetaMaskInstalled,
    connect,
    disconnect,
    switchNetwork,
    getBalance,
  }
}

