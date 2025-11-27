"use client"

import { useState, useEffect, useCallback } from "react"
import { formatEther } from "ethers"
import {
  getContractBalance,
  getContractOwner,
  deposit as depositToContract,
  withdraw as withdrawFromContract,
  withdrawAll as withdrawAllFromContract,
} from "@/lib/contract"

/**
 * Hook for managing contract state and transactions
 */
export function useContract(signer, isConnected) {
  const [contractBalance, setContractBalance] = useState("0")
  const [owner, setOwner] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [txStatus, setTxStatus] = useState(null) // { type: 'success' | 'error' | 'pending', message: string }

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
   * Refresh contract state
   */
  const refresh = useCallback(async () => {
    if (!isConnected) {
      setContractBalance("0")
      setOwner(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Use retry logic for both calls
      const [balance, ownerAddress] = await Promise.all([
        retryWithBackoff(() => getContractBalance()),
        retryWithBackoff(() => getContractOwner()),
      ])

      setContractBalance(balance)
      setOwner(ownerAddress)
    } catch (err) {
      // Handle rate limiting gracefully
      if (err?.code === -32005 || err?.data?.httpStatus === 429) {
        console.warn("Rate limited after retries, will retry later")
        // Don't set error for rate limiting, just log it - keep last known values
        return
      }
      console.error("Error refreshing contract state:", err)
      setError(err.message || "Failed to load contract data")
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, retryWithBackoff])

  // Auto-refresh on mount and when connection changes
  useEffect(() => {
    refresh()
    // Refresh every 15 seconds to reduce rate limiting
    const interval = setInterval(refresh, 15000)
    return () => clearInterval(interval)
  }, [refresh])

  /**
   * Deposit FLR to contract
   */
  const deposit = useCallback(
    async (amount) => {
      if (!signer || !isConnected) {
        throw new Error("Wallet not connected")
      }

      setIsLoading(true)
      setError(null)
      setTxStatus({ type: "pending", message: "Depositing FLR..." })

      try {
        // Small delay to help avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const tx = await depositToContract(signer, amount)
        setTxStatus({ type: "pending", message: `Transaction sent: ${tx.hash}` })

        // Wait for transaction with timeout
        const receipt = await Promise.race([
          tx.wait(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Transaction timeout. Please check your wallet.")), 60000)
          )
        ])
        setTxStatus({
          type: "success",
          message: `Successfully deposited ${amount} FLR`,
        })

        // Wait longer before refreshing to avoid rate limits after transaction
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        // Refresh contract state with retry (don't fail transaction if refresh fails)
        try {
          await refresh()
        } catch (refreshError) {
          // If refresh fails, don't fail the whole transaction
          if (refreshError?.code === -32005 || refreshError?.data?.httpStatus === 429) {
            setTxStatus({
              type: "success",
              message: `Successfully deposited ${amount} FLR (refresh delayed due to rate limit)`,
            })
          } else {
            console.warn("Failed to refresh contract state, but transaction succeeded:", refreshError)
            setTxStatus({
              type: "success",
              message: `Successfully deposited ${amount} FLR (refresh pending)`,
            })
          }
        }

        // Clear success message after 5 seconds
        setTimeout(() => setTxStatus(null), 5000)

        return receipt
      } catch (err) {
        let errorMessage = err.message || "Failed to deposit"
        
        // Handle rate limiting with user-friendly message
        if (err?.code === -32005 || err?.data?.httpStatus === 429) {
          errorMessage = "Network is busy. Please wait a moment and try again."
        } else if (err?.message?.includes("user rejected") || err?.code === 4001) {
          errorMessage = "Transaction was cancelled"
        } else if (err?.message?.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for this transaction"
        }
        
        setError(errorMessage)
        setTxStatus({ type: "error", message: errorMessage })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [signer, isConnected, refresh]
  )

  /**
   * Withdraw FLR from contract
   */
  const withdraw = useCallback(
    async (to, amount) => {
      if (!signer || !isConnected) {
        throw new Error("Wallet not connected")
      }

      setIsLoading(true)
      setError(null)
      setTxStatus({ type: "pending", message: "Withdrawing FLR..." })

      try {
        // Small delay to help avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const tx = await withdrawFromContract(signer, to, amount)
        setTxStatus({ type: "pending", message: `Transaction sent: ${tx.hash}` })

        // Wait for transaction with timeout
        const receipt = await Promise.race([
          tx.wait(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Transaction timeout. Please check your wallet.")), 60000)
          )
        ])
        setTxStatus({
          type: "success",
          message: `Successfully withdrew ${amount} FLR to ${to.slice(0, 6)}...${to.slice(-4)}`,
        })

        // Wait a bit before refreshing to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Refresh contract state with retry
        try {
          await refresh()
        } catch (refreshError) {
          // If refresh fails, don't fail the whole transaction
          console.warn("Failed to refresh contract state, but transaction succeeded:", refreshError)
          setTxStatus({
            type: "success",
            message: `Successfully withdrew ${amount} FLR (refresh pending)`,
          })
        }

        // Clear success message after 5 seconds
        setTimeout(() => setTxStatus(null), 5000)

        return receipt
      } catch (err) {
        let errorMessage = err.message || "Failed to withdraw"
        
        // Handle rate limiting with user-friendly message
        if (err?.code === -32005 || err?.data?.httpStatus === 429) {
          errorMessage = "Network is busy. Please wait a moment and try again."
        } else if (err?.message?.includes("user rejected") || err?.code === 4001) {
          errorMessage = "Transaction was cancelled"
        } else if (err?.message?.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for this transaction"
        }
        
        setError(errorMessage)
        setTxStatus({ type: "error", message: errorMessage })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [signer, isConnected, refresh]
  )

  /**
   * Withdraw all FLR from contract
   */
  const withdrawAll = useCallback(
    async (to) => {
      if (!signer || !isConnected) {
        throw new Error("Wallet not connected")
      }

      setIsLoading(true)
      setError(null)
      setTxStatus({ type: "pending", message: "Withdrawing all FLR..." })

      try {
        // Small delay to help avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const tx = await withdrawAllFromContract(signer, to)
        setTxStatus({ type: "pending", message: `Transaction sent: ${tx.hash}` })

        // Wait for transaction with timeout
        const receipt = await Promise.race([
          tx.wait(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Transaction timeout. Please check your wallet.")), 60000)
          )
        ])
        setTxStatus({
          type: "success",
          message: `Successfully withdrew all FLR to ${to.slice(0, 6)}...${to.slice(-4)}`,
        })

        // Wait a bit before refreshing to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Refresh contract state with retry
        try {
          await refresh()
        } catch (refreshError) {
          // If refresh fails, don't fail the whole transaction
          console.warn("Failed to refresh contract state, but transaction succeeded:", refreshError)
          setTxStatus({
            type: "success",
            message: `Successfully withdrew all FLR (refresh pending)`,
          })
        }

        // Clear success message after 5 seconds
        setTimeout(() => setTxStatus(null), 5000)

        return receipt
      } catch (err) {
        let errorMessage = err.message || "Failed to withdraw all"
        
        // Handle rate limiting with user-friendly message
        if (err?.code === -32005 || err?.data?.httpStatus === 429) {
          errorMessage = "Network is busy. Please wait a moment and try again."
        } else if (err?.message?.includes("user rejected") || err?.code === 4001) {
          errorMessage = "Transaction was cancelled"
        } else if (err?.message?.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for this transaction"
        }
        
        setError(errorMessage)
        setTxStatus({ type: "error", message: errorMessage })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [signer, isConnected, refresh]
  )

  return {
    contractBalance,
    owner,
    isLoading,
    error,
    txStatus,
    refresh,
    deposit,
    withdraw,
    withdrawAll,
  }
}

