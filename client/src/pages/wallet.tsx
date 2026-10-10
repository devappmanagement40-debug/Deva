import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChevronLeft, Check, CreditCard, Loader2, Trash2, Wifi } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import type { WithdrawalWallet } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import withdrawalLandscape from "@/assets/images/diamant-withdrawal-method-landscape.png";

const WITHDRAWAL_NETWORK = "USDT BEP20";

function displayAddress(address: string) {
  if (address.length < 16) return address;
  return `${address.slice(0, 4)}****${address.slice(-30)}`;
}

export default function WalletPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const selectMode = new URLSearchParams(searchString).get("from") === "withdrawal";

  const [showForm, setShowForm] = useState(false);
  const [address, setAddress] = useState("");

  const { data: wallets = [], isLoading } = useQuery<WithdrawalWallet[]>({
    queryKey: ["/api/wallets"],
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/wallets", {
        accountName: user?.fullName || user?.phone || "Portefeuille de retrait",
        accountNumber: address.trim(),
        type: "USDT",
        network: WITHDRAWAL_NETWORK,
        country: user!.country,
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: "Withdrawal method added successfully" });
      setShowForm(false);
      setAddress("");
    },
    onError: (error: Error) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("DELETE", `/api/wallets/${walletId}`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({ title: t.walletDeleted });
    },
    onError: (error: Error) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (walletId: number) => {
      const response = await apiRequest("PATCH", `/api/wallets/${walletId}/default`, {});
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wallets"] }),
    onError: (error: Error) => toast({ title: error.message || t.errorOccurred, variant: "destructive" }),
  });

  const resetForm = () => {
    setShowForm(false);
    setAddress("");
  };

  const handleConfirm = () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      toast({
        title: "Invalid USDT BEP20 address",
        description: "Use a BSC address starting with 0x and containing 40 hexadecimal characters.",
        variant: "destructive",
      });
      return;
    }
    if (!address.trim()) {
      toast({
        title: "Enter the withdrawal account",
        variant: "destructive",
      });
      return;
    }
    addMutation.mutate();
  };

  const selectWallet = (wallet: WithdrawalWallet) => {
    if (!selectMode) return;
    localStorage.setItem("selectedWalletId", wallet.id.toString());
    navigate("/withdrawal");
  };

  if (!user) return null;

  const backLink = selectMode ? "/withdrawal" : "/account";
  const withdrawalWallets = wallets.filter((wallet) => wallet.paymentMethod === WITHDRAWAL_NETWORK);

  return (
    <div className="relative min-h-screen overflow-clip bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[570px] overflow-hidden bg-[#a5ebef]">
        <img
          src={withdrawalLandscape}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#8de8ef]/35 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto min-h-screen w-full max-w-[480px]">
        <header className="flex h-[72px] items-center px-[18px]">
          <button
            type="button"
            onClick={() => showForm ? resetForm() : navigate(backLink)}
            className="flex h-10 w-10 items-center justify-center text-[#653de9] active:scale-95"
            aria-label="Retour"
            data-testid={showForm ? "button-back-form" : "button-back"}
          >
            <ChevronLeft className="h-8 w-8" strokeWidth={1.7} />
          </button>
          <h1 className="flex-1 pr-10 text-center text-[21px] font-medium tracking-tight text-[#13271e]">
            {showForm ? "Ajouter un moyen de retrait" : "Moyen de retrait"}
          </h1>
        </header>

        {showForm ? (
          <main className="px-[18px] pt-[2px]">
            <section
              className="overflow-hidden rounded-[5px] bg-white/90 px-5 pt-[19px] shadow-[0_8px_22px_rgba(0,68,50,0.08)] backdrop-blur-[2px]"
              data-testid="withdrawal-method-form"
            >
              <h2 className="mb-2 text-[19px] font-medium text-[#13271e]">Informations du moyen de retrait</h2>

              <div className="flex h-[42px] w-full items-center border-b border-[#c8d9d4] text-left">
                <span className="w-[104px] text-center text-[15px] text-[#24372e]">Réseau</span>
                <span className="flex-1 text-[16px] text-[#111f18]">{WITHDRAWAL_NETWORK}</span>
              </div>

              <div className="border-b border-[#c8d9d4] py-[12px]">
                <label htmlFor="wallet-network-address" className="sr-only">Adresse du réseau</label>
                <input
                  id="wallet-network-address"
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value.trim())}
                  placeholder="Adresse USDT BEP20"
                  maxLength={42}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  className="h-[44px] w-full bg-transparent px-0 text-right font-mono text-[16px] text-[#1e3026] outline-none placeholder:font-sans placeholder:text-center placeholder:text-[17px] placeholder:text-[#7b8580]"
                  data-testid="input-wallet-number"
                />
              </div>

            </section>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={addMutation.isPending}
              className="mt-[98px] h-[50px] w-full rounded-full text-[17px] font-medium text-white shadow-[0_5px_12px_rgba(0,128,65,0.24)] transition active:scale-[.98] disabled:opacity-60"
              style={{ background: "linear-gradient(90deg, #078a42 0%, #00c853 100%)" }}
              data-testid="button-confirm-wallet"
            >
              {addMutation.isPending ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Traitement…</span>
              ) : "Confirmer"}
            </button>
          </main>
        ) : isLoading ? (
          <div className="flex justify-center pt-28">
            <Loader2 className="h-7 w-7 animate-spin text-[#078a42]" />
          </div>
        ) : withdrawalWallets.length === 0 ? (
          <main className="px-[18px] pt-[80px]">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="h-[49px] w-full rounded-full text-[17px] font-medium text-white shadow-[0_5px_12px_rgba(0,128,65,0.22)] transition active:scale-[.98]"
              style={{ background: "linear-gradient(90deg, #078a42 0%, #00c853 100%)" }}
              data-testid="button-add-wallet"
            >
              Ajouter un moyen de retrait
            </button>
          </main>
        ) : (
          <main className="px-[18px] pt-[44px]">
            <div className="space-y-4">
              {withdrawalWallets.map((wallet) => (
                <div key={wallet.id}>
                  <button
                    type="button"
                    onClick={() => selectWallet(wallet)}
                    className={`relative block h-[256px] w-full overflow-hidden rounded-[20px] text-left text-white shadow-[0_12px_20px_rgba(0,76,43,0.26)] ${selectMode ? "active:scale-[.985]" : ""}`}
                    style={{ background: "linear-gradient(126deg, #063d2b 0%, #087a38 46%, #00b85a 100%)" }}
                    data-testid={`wallet-card-${wallet.id}`}
                  >
                    <div className="absolute -left-12 -top-20 h-80 w-20 rotate-[-18deg] bg-white/[0.12]" />
                    <div className="absolute left-[23%] -top-10 h-80 w-10 rotate-[-18deg] bg-white/[0.10]" />
                    <div className="absolute right-[11%] -top-12 h-80 w-10 rotate-[-18deg] bg-white/[0.09]" />
                    <p className="absolute left-[14px] top-[116px] max-w-[82%] break-all text-[17px] font-medium leading-[20px] tracking-[.02em]">
                      {displayAddress(wallet.accountNumber)}
                    </p>
                    <div className="absolute bottom-[35px] right-[39px] h-[47px] w-[70px] rounded-[9px] border border-white/45 bg-[linear-gradient(135deg,#fbf5cf,#c7b16b)] shadow-inner">
                      <div className="absolute inset-x-0 top-[15px] border-t border-[#9d8440]/40" />
                      <div className="absolute inset-x-0 top-[30px] border-t border-[#9d8440]/40" />
                      <div className="absolute bottom-0 left-[25px] top-0 border-l border-[#9d8440]/35" />
                    </div>
                    <div className="absolute left-5 top-5 flex items-center gap-2 text-[13px] font-semibold tracking-[.12em] text-white/90">
                      <CreditCard className="h-5 w-5" strokeWidth={1.7} />
                      DIAMANT
                    </div>
                    <div className="absolute bottom-5 left-5 flex items-center gap-2 text-[12px] text-white/75">
                      <Wifi className="h-4 w-4 rotate-90" />
                      {wallet.paymentMethod}
                    </div>
                  </button>

                  {!selectMode && (
                    <div className="mt-2 flex justify-end gap-2">
                      {!wallet.isDefault && (
                        <button
                          type="button"
                          onClick={() => setDefaultMutation.mutate(wallet.id)}
                          disabled={setDefaultMutation.isPending}
                          className="flex h-8 items-center gap-1 rounded-full bg-white/85 px-3 text-xs font-medium text-[#087a38] shadow-sm"
                          data-testid={`button-set-default-${wallet.id}`}
                        >
                          <Check className="h-3.5 w-3.5" /> Par défaut
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(wallet.id)}
                        disabled={deleteMutation.isPending}
                        className="flex h-8 items-center gap-1 rounded-full bg-white/85 px-3 text-xs font-medium text-[#63716b] shadow-sm"
                        data-testid={`button-delete-wallet-${wallet.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Supprimer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!selectMode && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 h-[49px] w-full rounded-full text-[17px] font-medium text-white shadow-[0_5px_12px_rgba(0,128,65,0.22)] transition active:scale-[.98]"
                style={{ background: "linear-gradient(90deg, #078a42 0%, #00c853 100%)" }}
                data-testid="button-add-wallet"
              >
                Ajouter un moyen de retrait
              </button>
            )}
          </main>
        )}
      </div>

    </div>
  );
}