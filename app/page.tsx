"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { MessageSquare, Map, Settings, Wallet, Send, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react'
import ChatPanel from "@/components/chat-panel"
import WindowFrame from "@/components/window-frame"
import styles from "@/styles/habbo.module.css"
import { useWallet } from "@/hooks/useWallet"
import { useContract } from "@/hooks/useContract"

function getOrCreateId(key: string) {
  try {
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(key, id)
    return id
  } catch {
    return "guest-" + Math.random().toString(36).slice(2, 10)
  }
}
function getOrCreateName() {
  try {
    const existing = localStorage.getItem("pp_name")
    if (existing) return existing
    const name = "Guest-" + Math.floor(Math.random() * 9000 + 1000)
    localStorage.setItem("pp_name", name)
    return name
  } catch {
    return "Guest-" + Math.floor(Math.random() * 9000 + 1000)
  }
}


export default function Page() {
  const [chatOpen, setChatOpen] = useState(true)
  const [navOpen, setNavOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Wallet integration
  const {
    address,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    signer,
    isMetaMaskInstalled,
    connect,
    disconnect,
    switchNetwork,
    getBalance,
  } = useWallet()

  const {
    contractBalance,
    owner,
    isLoading: contractLoading,
    error: contractError,
    txStatus,
    refresh,
    deposit,
    withdraw,
    withdrawAll,
  } = useContract(signer, isConnected)

  const [walletBalance, setWalletBalance] = useState("0")
  const [sendAmount, setSendAmount] = useState("")
  const [sendTo, setSendTo] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAllTo, setWithdrawAllTo] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch wallet balance periodically (reduced frequency to avoid rate limiting)
  useEffect(() => {
    if (!isConnected) {
      setWalletBalance("0")
      return
    }

    const fetchBalance = async () => {
      try {
        const balance = await getBalance()
        // Only update if we got a valid balance (null means rate limited, keep last value)
        if (balance !== null) {
          setWalletBalance(balance)
        }
      } catch (error) {
        // Silently handle errors to avoid console spam
        if (error?.code !== -32005 && error?.data?.httpStatus !== 429) {
          console.error("Error fetching balance:", error)
        }
      }
    }

    // Initial fetch
    fetchBalance()
    // Increased interval to 20 seconds to reduce rate limiting
    const interval = setInterval(fetchBalance, 20000)
    return () => clearInterval(interval)
  }, [isConnected, getBalance])

  // Wallet transaction handlers
  const handleConnect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      window.open("https://metamask.io/download/", "_blank")
      return
    }
    try {
      await connect()
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }, [connect])

  const handleSendFLR = useCallback(async () => {
    if (!sendTo || !sendAmount || isProcessing) return
    setIsProcessing(true)
    try {
      await withdraw(sendTo, sendAmount)
      setSendTo("")
      setSendAmount("")
    } catch (error) {
      console.error("Failed to send FLR:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [sendTo, sendAmount, isProcessing, withdraw])

  const handleDeposit = useCallback(async () => {
    if (!depositAmount || isProcessing) return
    setIsProcessing(true)
    try {
      await deposit(depositAmount)
      setDepositAmount("")
    } catch (error) {
      console.error("Failed to deposit:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [depositAmount, isProcessing, deposit])

  const handleWithdrawAll = useCallback(async () => {
    if (!withdrawAllTo || isProcessing) return
    setIsProcessing(true)
    try {
      await withdrawAll(withdrawAllTo)
      setWithdrawAllTo("")
    } catch (error) {
      console.error("Failed to withdraw all:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [withdrawAllTo, isProcessing, withdrawAll])


  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <header className="border-b border-black/40 bg-[#2f2f2f]">
        <div className="max-w-6xl mx-auto px-3 py-2 flex items-center gap-3">
          <div className={styles.logoBlock} aria-label="Flare Wallet logo">
            <span className={styles.logoWord}>A simple smart contract wallet built on the flare bootcamp</span>
          </div>
          <Separator orientation="vertical" className="h-6 bg-black/50" />
          <div className="text-sm text-white/80 hidden sm:block">
            {isConnected ? `Connected: ${address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}` : "Flare Coston2 Testnet Wallet"}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isConnected ? (
              <Button variant="outline" className={styles.pixelButton} onClick={disconnect}>
                <Wallet className="w-4 h-4" /> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Disconnect"}
              </Button>
            ) : (
              <Button
                variant="outline"
                className={styles.pixelButton}
                onClick={handleConnect}
                disabled={isConnecting}
              >
                <Wallet className="w-4 h-4" /> {isConnecting ? "Connecting..." : isMetaMaskInstalled ? "Connect Wallet" : "Install MetaMask"}
              </Button>
            )}
            {!isCorrectNetwork && isConnected && (
              <Button variant="outline" className={styles.pixelButton} onClick={switchNetwork}>
                Switch Network
              </Button>
            )}
            <Button variant="outline" className={styles.pixelButton} onClick={() => setNavOpen((v) => !v)}>
              <Map className="w-4 h-4" /> Account
            </Button>
            <Button variant="outline" className={styles.pixelButton} onClick={() => setChatOpen((v) => !v)}>
              <MessageSquare className="w-4 h-4" /> Transactions
            </Button>
            <Button variant="outline" className={styles.pixelButton} onClick={() => setSettingsOpen((v) => !v)}>
              <Settings className="w-4 h-4" /> Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto p-4">
          {!isConnected && (
            <div className="text-center py-20">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Connect your wallet to get started</p>
            </div>
          )}
        </div>
      </main>

      {chatOpen && (
        <WindowFrame
          id="chat"
          title="Wallet Transactions"
          variant="habbo"
          initial={{ x: 16, y: 88, w: 400, h: 550 }}
          onClose={() => setChatOpen(false)}
          ariaTitle="Wallet transactions window"
        >
          <div className={styles.windowBody}>
            {isConnected ? (
              <div className="p-3 flex flex-col gap-3">
                <div className="px-3 py-2 text-[12px] text-black/80 border-b border-black/20 mb-2">
                  Smart Wallet Operations
                </div>
                
                {/* Send FLR */}
                <div className="border border-black/20 rounded-md px-3 py-2 bg-white">
                  <div className="text-[12px] font-semibold mb-2 flex items-center gap-2">
                    <Send className="w-4 h-4" /> Send FLR from Contract
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] text-black/60 mb-1">Recipient Address</div>
                    <Input
                      placeholder="0x..."
                      value={sendTo}
                      onChange={(e) => setSendTo(e.target.value)}
                      className={styles.pixelInput}
                    />
                    <div className="text-[11px] text-black/60 mb-1">Amount (FLR)</div>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="0.0"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className={styles.pixelInput}
                    />
                    <Button
                      size="sm"
                      className={styles.goButton}
                      onClick={handleSendFLR}
                      disabled={!sendTo || !sendAmount || isProcessing || contractLoading}
                    >
                      {isProcessing ? "Processing..." : "Send FLR"}
                    </Button>
                  </div>
                </div>

                {/* Deposit FLR */}
                <div className="border border-black/20 rounded-md px-3 py-2 bg-white">
                  <div className="text-[12px] font-semibold mb-2 flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4" /> Deposit FLR to Contract
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] text-black/60 mb-1">Amount (FLR)</div>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="0.0"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className={styles.pixelInput}
                    />
                    <Button
                      size="sm"
                      className={styles.goButton}
                      onClick={handleDeposit}
                      disabled={!depositAmount || isProcessing || contractLoading}
                    >
                      {isProcessing ? "Processing..." : "Deposit FLR"}
                    </Button>
                  </div>
                </div>

                {/* Withdraw All */}
                <div className="border border-black/20 rounded-md px-3 py-2 bg-white">
                  <div className="text-[12px] font-semibold mb-2 flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4" /> Withdraw All from Contract
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] text-black/60 mb-1">Recipient Address</div>
                    <Input
                      placeholder="0x..."
                      value={withdrawAllTo}
                      onChange={(e) => setWithdrawAllTo(e.target.value)}
                      className={styles.pixelInput}
                    />
                    <Button
                      size="sm"
                      className={styles.goButton}
                      onClick={handleWithdrawAll}
                      disabled={!withdrawAllTo || isProcessing || contractLoading}
                    >
                      {isProcessing ? "Processing..." : "Withdraw All FLR"}
                    </Button>
                  </div>
                </div>

                {/* Transaction Status */}
                {txStatus && (
                  <div className={`px-3 py-2 rounded-md border text-[11px] ${
                    txStatus.type === "success" ? "bg-green-50 border-green-300 text-green-800" :
                    txStatus.type === "error" ? "bg-red-50 border-red-300 text-red-800" :
                    "bg-blue-50 border-blue-300 text-blue-800"
                  }`}>
                    {txStatus.message}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-3 py-4 text-center">
                <div className="text-[12px] text-black/60 mb-3">
                  Connect your wallet to perform transactions
                </div>
                <Button
                  size="sm"
                  className={styles.goButton}
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {isConnecting ? "Connecting..." : isMetaMaskInstalled ? "Connect Wallet" : "Install MetaMask"}
                </Button>
              </div>
            )}
          </div>
        </WindowFrame>
      )}

      {navOpen && (
        <WindowFrame
          id="navigator"
          title="Account Overview"
          variant="habbo"
          initial={{ x: 400, y: 88, w: 360, h: 420 }}
          onClose={() => setNavOpen(false)}
          ariaTitle="Account overview window"
        >
          <div className="p-0 h-full flex flex-col">
            <div className={styles.tabBar}>
              <div className={styles.tabActive}>Account Overview</div>
              <div className={styles.tab}>Transactions</div>
            </div>
            {isConnected ? (
              <>
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="text-[12px] text-black/80">Wallet Information</div>
                  <Button
                    size="sm"
                    className={styles.goButton}
                    onClick={async () => {
                      try {
                        await refresh()
                        // Also refresh wallet balance
                        const balance = await getBalance()
                        if (balance !== null) setWalletBalance(balance)
                      } catch (error) {
                        console.error("Refresh error:", error)
                      }
                    }}
                    disabled={contractLoading}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
                <div className="px-3 pb-3 space-y-2">
                  <div className={styles.navRow}>
                    <div className={styles.navDot} />
                    <div className="truncate">Wallet Address</div>
                    <div className="ml-auto text-[11px] text-black/60 font-mono">
                      {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Not connected"}
                    </div>
                  </div>
                  <div className={styles.navRow}>
                    <div className={styles.navDot} />
                    <div className="truncate">Wallet Balance</div>
                    <div className="ml-auto text-[11px] text-black/60 font-semibold">
                      {walletBalance} FLR
                    </div>
                  </div>
                  <div className={styles.navRow}>
                    <div className={styles.navDot} />
                    <div className="truncate">Contract Balance</div>
                    <div className="ml-auto text-[11px] text-black/60 font-semibold">
                      {contractLoading ? "Loading..." : `${contractBalance} FLR`}
                    </div>
                  </div>
                  <div className={styles.navRow}>
                    <div className={styles.navDot} />
                    <div className="truncate">Contract Owner</div>
                    <div className="ml-auto text-[11px] text-black/60 font-mono">
                      {owner ? `${owner.slice(0, 8)}...${owner.slice(-6)}` : "Loading..."}
                    </div>
                  </div>
                  <div className={styles.navRow}>
                    <div className={styles.navDot} />
                    <div className="truncate">Network</div>
                    <div className="ml-auto">
                      <div className={styles.statusPill}>{isCorrectNetwork ? "Flare Coston2" : "Wrong Network"}</div>
                    </div>
                  </div>
                </div>
                {txStatus && (
                  <div className={`px-3 py-2 mx-3 mb-2 rounded-md border text-[11px] ${
                    txStatus.type === "success" ? "bg-green-50 border-green-300 text-green-800" :
                    txStatus.type === "error" ? "bg-red-50 border-red-300 text-red-800" :
                    "bg-blue-50 border-blue-300 text-blue-800"
                  }`}>
                    {txStatus.message}
                  </div>
                )}
                {contractError && (
                  <div className="px-3 py-2 mx-3 mb-2 rounded-md border bg-red-50 border-red-300 text-red-800 text-[11px]">
                    {contractError}
                  </div>
                )}
              </>
            ) : (
              <div className="px-3 py-4 text-center">
                <div className="text-[12px] text-black/60 mb-3">
                  Connect your wallet to view account information
                </div>
                <Button
                  size="sm"
                  className={styles.goButton}
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {isConnecting ? "Connecting..." : isMetaMaskInstalled ? "Connect Wallet" : "Install MetaMask"}
                </Button>
              </div>
            )}
            <div className="mt-auto border-t border-black/20 text-[11px] text-black/70 px-3 py-2">
              Flare Coston2 Testnet • Contract: 0x735E...07F9
            </div>
          </div>
        </WindowFrame>
      )}

      {settingsOpen && (
        <WindowFrame
          id="settings"
          title="Settings"
          variant="habbo"
          initial={{ x: 780, y: 88, w: 360, h: 260 }}
          onClose={() => setSettingsOpen(false)}
          ariaTitle="Settings window"
        >
          <div className="p-3 flex flex-col gap-3">
            <div className="text-[13px] font-semibold">Wallet Settings</div>
            <div className="border border-black/20 rounded-md px-3 py-2 bg-white">
              <div className="text-[12px] text-black/70">
                Flare Coston2 Testnet
              </div>
              <div className="text-[11px] text-black/50 mt-1">
                Contract: 0x244c...8Cfa
              </div>
            </div>

          </div>
        </WindowFrame>
      )}
    </div>
  )
}
