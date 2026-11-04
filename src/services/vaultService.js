import { ethers } from "ethers";
import { VAULT_ABI } from "../config/abis";
import { VAULT_ADDRESS as DEFAULT_VAULT_ADDRESS } from "../config/addresses";

export function getVaultContract(providerOrSigner, address = DEFAULT_VAULT_ADDRESS) {
  return new ethers.Contract(address, VAULT_ABI, providerOrSigner);
}

export async function getRewardBalance(provider, vaultAddress = DEFAULT_VAULT_ADDRESS, userAddress) {
  if (!provider || !userAddress) return 0;
  try {
    const contract = getVaultContract(provider, vaultAddress);
    const balance = await contract.getRewardBalance(userAddress);
    return Number(balance);
  } catch (err) {
    console.error("Failed to fetch reward balance:", err);
    return 0;
  }
}

export async function getVaultRegistry(provider, vaultAddress = DEFAULT_VAULT_ADDRESS) {
  if (!provider) return null;
  try {
    const contract = getVaultContract(provider, vaultAddress);
    return await contract.registry();
  } catch (err) {
    console.error("Failed to fetch vault registry:", err);
    return null;
  }
}

export async function getVaultOwner(provider, vaultAddress = DEFAULT_VAULT_ADDRESS) {
  if (!provider) return null;
  try {
    const contract = getVaultContract(provider, vaultAddress);
    return await contract.owner();
  } catch (err) {
    console.error("Failed to fetch vault owner:", err);
    return null;
  }
}
