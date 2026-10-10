export const INTERNATIONAL_CRYPTO_METHODS = [
  { code: "usdtbsc", label: "BEP20-USDT", token: "USDT", network: "BNB Smart Chain (BEP20)", minimumAssetAmount: "2" },
  { code: "usdcbsc", label: "BEP20-USDC", token: "USDC", network: "BNB Smart Chain (BEP20)", minimumAssetAmount: "2" },
  { code: "bnbbsc", label: "BNB", token: "BNB", network: "BNB Smart Chain", minimumAssetAmount: "0.003" },
  { code: "usdttrc20", label: "TRC20-USDT", token: "USDT", network: "TRON (TRC20)", minimumAssetAmount: "2" },
  { code: "trx", label: "TRC20-TRX", token: "TRX", network: "TRON (TRC20)", minimumAssetAmount: "10" },
  { code: "eth", label: "ETH", token: "ETH", network: "Ethereum", minimumAssetAmount: "0.001" },
  { code: "usdterc20", label: "ETH-USDT", token: "USDT", network: "Ethereum (ERC20)", minimumAssetAmount: "2" },
  { code: "usdc", label: "ETH-USDC", token: "USDC", network: "Ethereum (ERC20)", minimumAssetAmount: "2" },
  { code: "pyusd", label: "ETH-PYUSD", token: "PYUSD", network: "Ethereum (ERC20)", minimumAssetAmount: null },
  { code: "maticmainnet", label: "POLYGON", token: "POL", network: "Polygon", minimumAssetAmount: null },
  { code: "usdtmatic", label: "POLYGON-USDT", token: "USDT", network: "Polygon", minimumAssetAmount: "2" },
  { code: "usdcmatic", label: "POLYGON-USDC", token: "USDC", network: "Polygon", minimumAssetAmount: "2" },
] as const;

export type InternationalCryptoMethod = typeof INTERNATIONAL_CRYPTO_METHODS[number];

export function getInternationalCryptoMethod(value: unknown): InternationalCryptoMethod | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return INTERNATIONAL_CRYPTO_METHODS.find((method) => method.code === normalized);
}
