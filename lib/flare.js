import { JsonRpcProvider } from "ethers"

/**
 * Flare Coston2 Testnet Configuration
 */
export const FLARE_NETWORK = {
  chainId: 114,
  name: "Flare Coston2",
  currency: "FLR",
  rpcUrl: "https://coston2-api.flare.network/ext/C/rpc",
}

/**
 * Creates and returns a JSON-RPC provider for Flare Coston2
 */
export function getFlareProvider() {
  return new JsonRpcProvider(FLARE_NETWORK.rpcUrl)
}

/**
 * Network configuration for MetaMask
 */
export const FLARE_METAMASK_CONFIG = {
  chainId: `0x${FLARE_NETWORK.chainId.toString(16)}`,
  chainName: FLARE_NETWORK.name,
  nativeCurrency: {
    name: FLARE_NETWORK.currency,
    symbol: FLARE_NETWORK.currency,
    decimals: 18,
  },
  rpcUrls: [FLARE_NETWORK.rpcUrl],
  blockExplorerUrls: ["https://coston2-explorer.flare.network"],
}

