"use client";

import { BrowserProvider, Contract, JsonRpcProvider, getBytes } from "ethers";

export type SupportedChainKey = "polygon-amoy" | "base-sepolia" | "hardhat-local" | "custom-private";

export type WalletSnapshot = {
  connected: boolean;
  address: string;
  chainId: number | null;
  chainKey: SupportedChainKey;
};

export const registryStatusCodes = {
  ReportCreated: 0,
  RepairSubmitted: 1,
  AdminApproved: 2,
  WarrantyActivated: 3,
  RepeatFailure: 4,
  Closed: 5,
} as const;

export type RegistryStatusName = keyof typeof registryStatusCodes;
export type RegistryStatusCode = (typeof registryStatusCodes)[RegistryStatusName];

export type OnChainProofRecord = {
  exists: boolean;
  reportHash: string;
  repairHash: string;
  status: RegistryStatusCode;
  statusLabel: RegistryStatusName;
  actor: string;
  updatedAt: number;
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
  "hardhat-local": {
    chainId: 31337,
    chainIdHex: "0x7a69",
    name: "Hardhat Local",
    nativeCurrency: { name: "Local Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["http://127.0.0.1:8545"],
    blockExplorerUrls: [""],
  },
  "custom-private": {
    chainId: getCustomChainId(),
    chainIdHex: `0x${getCustomChainId().toString(16)}`,
    name: process.env.NEXT_PUBLIC_CITYPRAMAAN_CHAIN_NAME ?? "CityPramaan Private TestNet",
    nativeCurrency: {
      name: process.env.NEXT_PUBLIC_CITYPRAMAAN_NATIVE_NAME ?? "Test Ether",
      symbol: process.env.NEXT_PUBLIC_CITYPRAMAAN_NATIVE_SYMBOL ?? "ETH",
      decimals: 18,
    },
    rpcUrls: [process.env.NEXT_PUBLIC_CITYPRAMAAN_RPC_URL ?? ""].filter(Boolean),
    blockExplorerUrls: [process.env.NEXT_PUBLIC_CITYPRAMAAN_EXPLORER_URL ?? ""].filter(Boolean),
  },
};

const cityPramaanRegistryAbi = [
  "function proofs(string publicId) view returns (bytes32 reportHash, bytes32 repairHash, uint8 status, address actor, uint256 updatedAt)",
  "function createReport(string publicId, bytes32 reportHash)",
  "function submitRepair(string publicId, bytes32 repairHash)",
  "function updateStatus(string publicId, uint8 status)",
];

const zeroAddress = "0x0000000000000000000000000000000000000000";
const emptyBytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
const registryStatusLabels = Object.keys(registryStatusCodes) as RegistryStatusName[];

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
      connected: Boolean(parsed.connected && isWalletAddress(parsed.address ?? "")),
      address: isWalletAddress(parsed.address ?? "") ? parsed.address ?? "" : "",
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
    throw new Error("MetaMask was not detected. Install MetaMask, refresh the page, and connect your wallet.");
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
  const contract = await getWriteRegistryContract();
  const transaction = await contract.createReport(publicId, normalizeBytes32(reportHash));
  const receipt = await transaction.wait();
  return String(receipt?.hash ?? transaction.hash);
}

export async function submitRepairTransaction(publicId: string, repairHash: string) {
  const contract = await getWriteRegistryContract();
  const transaction = await contract.submitRepair(publicId, normalizeBytes32(repairHash));
  const receipt = await transaction.wait();
  return String(receipt?.hash ?? transaction.hash);
}

export async function updateProofStatusTransaction(publicId: string, status: RegistryStatusCode) {
  const contract = await getWriteRegistryContract();
  const transaction = await contract.updateStatus(publicId, status);
  const receipt = await transaction.wait();
  return String(receipt?.hash ?? transaction.hash);
}

export async function readProofRecord(publicId: string): Promise<OnChainProofRecord> {
  const contract = getReadRegistryContract();
  const record = await contract.proofs(publicId);
  const status = Number(record.status ?? record[2]) as RegistryStatusCode;
  const updatedAt = Number(record.updatedAt ?? record[4] ?? 0);
  const reportHash = String(record.reportHash ?? record[0] ?? emptyBytes32);
  const repairHash = String(record.repairHash ?? record[1] ?? emptyBytes32);
  const actor = String(record.actor ?? record[3] ?? zeroAddress);

  return {
    exists: updatedAt > 0,
    reportHash,
    repairHash,
    status,
    statusLabel: registryStatusLabel(status),
    actor,
    updatedAt,
  };
}

export function buildExplorerTxUrl(txHash: string, chainKey: SupportedChainKey = getPreferredChainKey()) {
  if (!txHash || !txHash.startsWith("0x")) {
    return "";
  }

  const explorer = supportedChains[chainKey].blockExplorerUrls[0];
  if (!explorer) {
    return "";
  }

  return `${explorer.replace(/\/$/, "")}/tx/${txHash}`;
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

async function getWriteRegistryContract() {
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

function getReadRegistryContract() {
  const address = getContractAddress();

  if (!address) {
    throw new Error("Missing NEXT_PUBLIC_CITYPRAMAAN_CONTRACT. Deploy the registry contract and add its address to Vercel.");
  }

  const chain = supportedChains[getPreferredChainKey()];
  const rpcUrl = chain.rpcUrls[0];

  if (!rpcUrl) {
    throw new Error("Missing NEXT_PUBLIC_CITYPRAMAAN_RPC_URL. Add your Tenderly RPC URL to Vercel.");
  }

  return new Contract(address, cityPramaanRegistryAbi, new JsonRpcProvider(rpcUrl, chain.chainId));
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

export function hasEthereumProvider() {
  return Boolean(getEthereumProvider());
}

function requireEthereumProvider() {
  const ethereum = getEthereumProvider();

  if (!ethereum) {
    throw new Error("MetaMask was not detected. Install MetaMask and refresh the page.");
  }

  return ethereum;
}

function getCustomChainId() {
  const value = Number(process.env.NEXT_PUBLIC_CITYPRAMAAN_CHAIN_ID);
  return Number.isFinite(value) && value > 0 ? value : 9991;
}

function isWalletAddress(address: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

function registryStatusLabel(status: number): RegistryStatusName {
  return registryStatusLabels[status] ?? "ReportCreated";
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
