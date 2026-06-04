"use client";

import { BrowserProvider, Contract, getBytes } from "ethers";

export type SupportedChainKey = "polygon-amoy" | "base-sepolia";

export type WalletSnapshot = {
  connected: boolean;
  address: string;
  chainId: number | null;
  chainKey: SupportedChainKey;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
};

export const WALLET_KEY = "city-pramaan:wallet";
export const WALLET_UPDATED_EVENT = "city-pramaan:wallet-updated";

export const supportedChains: Record<
  SupportedChainKey,
  {
    chainId: number;
    chainIdHex: string;
    name: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: string[];
    blockExplorerUrls: string[];
  }
> = {
  "polygon-amoy": {
    chainId: 80002,
    chainIdHex: "0x13882",
    name: "Polygon Amoy",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: ["https://rpc-amoy.polygon.technology"],
    blockExplorerUrls: ["https://amoy.polygonscan.com"],
  },
  "base-sepolia": {
    chainId: 84532,
    chainIdHex: "0x14a34",
    name: "Base Sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia.base.org"],
    blockExplorerUrls: ["https://sepolia.basescan.org"],
  },
};

const cityPramaanRegistryAbi = [
  "function createReport(string publicId, bytes32 reportHash)",
  "function submitRepair(string publicId, bytes32 repairHash)",
  "function updateStatus(string publicId, uint8 status)",
];

export function getPreferredChainKey(): SupportedChainKey {
  const configured = process.env.NEXT_PUBLIC_CITYPRAMAAN_CHAIN as SupportedChainKey | undefined;
  return configured && configured in supportedChains ? configured : "polygon-amoy";
}

export function getContractAddress() {
  return process.env.NEXT_PUBLIC_CITYPRAMAAN_CONTRACT ?? "";
}

export function getWalletSnapshot(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(WALLET_KEY) ?? "";
}

export function parseWalletSnapshot(snapshot: string): WalletSnapshot {
  try {
    const parsed = snapshot ? (JSON.parse(snapshot) as Partial<WalletSnapshot>) : {};
    const chainKey =
      parsed.chainKey && parsed.chainKey in supportedChains
        ? parsed.chainKey
        : getPreferredChainKey();

    return {
      connected: Boolean(parsed.connected && parsed.address),
      address: parsed.address ?? "",
      chainId: typeof parsed.chainId === "number" ? parsed.chainId : null,
      chainKey,
    };
  } catch {
    return {
      connected: false,
      address: "",
      chainId: null,
      chainKey: getPreferredChainKey(),
    };
  }
}

export async function connectWallet(chainKey: SupportedChainKey = getPreferredChainKey()) {
  const ethereum = getEthereumProvider();

  if (!ethereum) {
    throw new Error("MetaMask was not detected. Install MetaMask and refresh the page.");
  }

  const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts[0];

  if (!address) {
    throw new Error("No wallet account was selected.");
  }

  await switchToSupportedChain(chainKey);
  const chainIdHex = (await ethereum.request({ method: "eth_chainId" })) as string;
  const snapshot = {
    connected: true,
    address,
    chainId: Number.parseInt(chainIdHex, 16),
    chainKey,
  };

  saveWalletSnapshot(snapshot);
  attachWalletListeners();
  return snapshot;
}

export function disconnectWallet() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(WALLET_KEY);
  window.dispatchEvent(new Event(WALLET_UPDATED_EVENT));
}

export async function switchToSupportedChain(chainKey: SupportedChainKey) {
  const ethereum = requireEthereumProvider();
  const chain = supportedChains[chainKey];

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chain.chainIdHex }],
    });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? Number(error.code) : 0;

    if (code !== 4902) {
      throw error;
    }

    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chain.chainIdHex,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: chain.rpcUrls,
          blockExplorerUrls: chain.blockExplorerUrls,
        },
      ],
    });
  }

  const current = parseWalletSnapshot(getWalletSnapshot());
  saveWalletSnapshot({
    ...current,
    chainId: chain.chainId,
    chainKey,
  });
}

export async function createReportTransaction(publicId: string, reportHash: string) {
  const contract = await getRegistryContract();
  const transaction = await contract.createReport(publicId, normalizeBytes32(reportHash));
  const receipt = await transaction.wait();
  return String(receipt?.hash ?? transaction.hash);
}

export async function submitRepairTransaction(publicId: string, repairHash: string) {
  const contract = await getRegistryContract();
  const transaction = await contract.submitRepair(publicId, normalizeBytes32(repairHash));
  const receipt = await transaction.wait();
  return String(receipt?.hash ?? transaction.hash);
}

export function buildExplorerTxUrl(txHash: string, chainKey: SupportedChainKey = getPreferredChainKey()) {
  const explorer = supportedChains[chainKey].blockExplorerUrls[0];
  return `${explorer}/tx/${txHash}`;
}

export function shortWalletAddress(address: string) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function subscribeWallet(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === WALLET_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(WALLET_UPDATED_EVENT, callback);
  attachWalletListeners();

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(WALLET_UPDATED_EVENT, callback);
  };
}

async function getRegistryContract() {
  const address = getContractAddress();

  if (!address) {
    throw new Error("Missing NEXT_PUBLIC_CITYPRAMAAN_CONTRACT. Deploy the registry contract and add its address to .env.local.");
  }

  const wallet = parseWalletSnapshot(getWalletSnapshot());
  await switchToSupportedChain(wallet.chainKey);
  const provider = new BrowserProvider(requireEthereumProvider());
  const signer = await provider.getSigner();
  return new Contract(address, cityPramaanRegistryAbi, signer);
}

function saveWalletSnapshot(snapshot: WalletSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WALLET_KEY, JSON.stringify(snapshot));
  window.dispatchEvent(new Event(WALLET_UPDATED_EVENT));
}

function normalizeBytes32(hash: string) {
  if (/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    return hash;
  }

  const bytes = getBytes(hash);

  if (bytes.length !== 32) {
    throw new Error("Proof hash must be a 32-byte hex string.");
  }

  return hash;
}

function getEthereumProvider() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as Window & { ethereum?: EthereumProvider }).ethereum;
}

function requireEthereumProvider() {
  const ethereum = getEthereumProvider();

  if (!ethereum) {
    throw new Error("MetaMask was not detected. Install MetaMask and refresh the page.");
  }

  return ethereum;
}

let listenersAttached = false;

function attachWalletListeners() {
  if (listenersAttached || typeof window === "undefined") {
    return;
  }

  const ethereum = getEthereumProvider();

  if (!ethereum?.on) {
    return;
  }

  ethereum.on("accountsChanged", (accountsValue) => {
    const accounts = Array.isArray(accountsValue) ? accountsValue.map(String) : [];
    const current = parseWalletSnapshot(getWalletSnapshot());

    if (!accounts[0]) {
      disconnectWallet();
      return;
    }

    saveWalletSnapshot({
      ...current,
      connected: true,
      address: accounts[0],
    });
  });

  ethereum.on("chainChanged", (chainIdValue) => {
    const chainIdHex = String(chainIdValue);
    const chainId = Number.parseInt(chainIdHex, 16);
    const current = parseWalletSnapshot(getWalletSnapshot());
    const matchingChain = Object.entries(supportedChains).find(([, chain]) => chain.chainId === chainId)?.[0] as
      | SupportedChainKey
      | undefined;

    saveWalletSnapshot({
      ...current,
      chainId,
      chainKey: matchingChain ?? current.chainKey,
    });
  });

  listenersAttached = true;
}
