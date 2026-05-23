export const MOCK_WALLET_ADDRESS = "0x7A3f...C91B";
export const WALLET_KEY = "city-pramaan:wallet-connected";

export function getWalletSnapshot() {
  if (typeof window === "undefined") {
    return "false";
  }

  return window.localStorage.getItem(WALLET_KEY) ?? "false";
}

export function connectMockWallet() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WALLET_KEY, "true");
  window.dispatchEvent(new Event("city-pramaan:wallet-updated"));
}

export function disconnectMockWallet() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(WALLET_KEY);
  window.dispatchEvent(new Event("city-pramaan:wallet-updated"));
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
  window.addEventListener("city-pramaan:wallet-updated", callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("city-pramaan:wallet-updated", callback);
  };
}
