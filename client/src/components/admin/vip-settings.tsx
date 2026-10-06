import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save } from "lucide-react";
import { DEFAULT_VIP_CONFIGS } from "@/lib/vip";
import { displayCurrencyText } from "@/lib/content";
import { MAX_VIP_LEVEL } from "@shared/vip-progress";

export default function AdminVipSettings() {
  const { toast } = useToast();
  const { data: settings = {}, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const [form, setForm] = useState<Record<string, string>>({});

  const legacyVipCopy: Record<string, string | string[]> = {
    vip0Description: "Membre inscrit n'ayant pas encore investi.",
    vip0Advantages: "Accès à la plateforme. Possibilité de déposer et d'investir.",
    vip1Description: "Nouveau membre ayant réalisé son premier investissement.",
    vip1Advantages: "Accès complet à la plateforme. Gains quotidiens. Commissions de parrainage actives.",
    vip2Description: [
      "Seuil d'investissement personnel cumulé dans Parcours atteint.",
      "Membre actif avec 3 filleuls directs (niveau A).",
    ],
    vip2Advantages: "Statut VIP 2. Reconnaissance de votre activité de recrutement.",
    vip3Description: [
      "Seuil d'investissement personnel cumulé dans Parcours atteint.",
      "Minimum 3 membres directs (A) ayant commencé à construire leur propre réseau (niveau B).",
    ],
    vip3Advantages: "Statut VIP 3. Équipe structurée sur 2 niveaux.",
    vip4Description: [
      "Seuil d'investissement personnel cumulé dans Parcours atteint.",
      "Minimum 100 membres dans l'équipe totale (niveaux A + B + C).",
    ],
    vip4Advantages: "Statut VIP 4. Leader d'équipe confirmé.",
    vip5Description: [
      "Seuil d'investissement personnel cumulé dans Parcours atteint.",
      "Minimum 300 membres dans l'équipe totale.",
    ],
    vip5Advantages: "Statut VIP 5. Ambassadeur de la plateforme.",
    vip6Description: [
      "Seuil d'investissement personnel cumulé dans Parcours atteint.",
      "Minimum 600 membres dans l'équipe totale.",
    ],
    vip6Advantages: "Statut VIP 6. Partenaire élite.",
    vip7Description: [
      "Seuil d'investissement personnel cumulé dans Parcours atteint.",
      "Minimum 1 000 membres dans l'équipe totale.",
    ],
    vip7Advantages: "Statut VIP 7. Rang suprême. Reconnaissance maximale.",
  };
  const val = (key: string, fallback: string) => {
    if (form[key] !== undefined) return form[key];
    const savedValue = settings[key];
    const legacyValue = legacyVipCopy[key];
    const isLegacyValue = Array.isArray(legacyValue)
      ? legacyValue.includes(savedValue ?? "")
      : savedValue === legacyValue;
    return isLegacyValue ? fallback : (savedValue ?? fallback);
  };

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/settings", form);
      if (!res.ok) throw new Error("Erreur serveur");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setForm({});
      toast({ title: "✅ Paramètres VIP sauvegardés" });
    },
    onError: (e: any) => {
      toast({ title: e.message || "Erreur", variant: "destructive" });
    },
  });

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold">⭐ Configuration des niveaux VIP</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          VIP 1 s’obtient après le premier achat personnel payant dans Parcours. À partir de là, les seuils VIP suivants dépendent du cumul des achats personnels payants de toutes les catégories, en XOF.
        </p>
      </div>

      {DEFAULT_VIP_CONFIGS.map((cfg) => (
        <Card key={cfg.level}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              ★&nbsp;
              <input
                className="font-bold bg-transparent border-b border-dashed border-muted-foreground/40 focus:outline-none focus:border-primary w-20 text-sm"
                value={val(`vip${cfg.level}Label`, cfg.label)}
                onChange={(e) => set(`vip${cfg.level}Label`, e.target.value)}
              />
              <span className="text-xs font-normal text-muted-foreground">— Niveau {cfg.level}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* ── Conditions personnelles ── */}
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Investissement personnel — tous les produits payants</p>
              {cfg.level === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Explore ne donne pas de niveau VIP. Le membre reste VIP 0 tant qu’il n’a pas effectué d’achat Parcours.
                </p>
              )}
              {cfg.level === 1 && (
                <p className="text-xs text-muted-foreground italic">
                  ✦ VIP 1 est obtenu après le premier achat personnel payant dans Parcours.
                </p>
              )}
              {cfg.level >= 2 && cfg.level <= MAX_VIP_LEVEL && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-52 shrink-0">
                    Investissement cumulé minimum
                  </label>
                  <Input
                    type="number" min="1" step="1"
                    className="h-8 text-sm w-24"
                    placeholder="Non configuré"
                    value={val(`vip${cfg.level}MinInvestment`, cfg.minInvestment !== null ? String(cfg.minInvestment) : "")}
                    onChange={(e) => set(`vip${cfg.level}MinInvestment`, e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">XOF</span>
                </div>
              )}
              {cfg.level >= 2 && (
                <p className="text-[10px] text-muted-foreground">
                  Cumul de tous les achats personnels payants (Explore, Parcours et Offres), y compris ceux réalisés avant le premier achat Parcours. Les produits gratuits et attribués par l’administration ne comptent pas. Configure les niveaux dans l’ordre avec des montants croissants.
                </p>
              )}
            </div>

            {/* ── Textes ── */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Textes affichés</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={displayCurrencyText(cfg.description)}
                  value={displayCurrencyText(val(`vip${cfg.level}Description`, cfg.description))}
                  onChange={(e) => set(`vip${cfg.level}Description`, e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Avantages</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={cfg.advantages}
                  value={val(`vip${cfg.level}Advantages`, cfg.advantages)}
                  onChange={(e) => set(`vip${cfg.level}Advantages`, e.target.value)}
                />
              </div>
            </div>

          </CardContent>
        </Card>
      ))}

      <Button
        className="w-full"
        disabled={saveMutation.isPending || Object.keys(form).length === 0}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending
          ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
          : <Save className="w-4 h-4 mr-2" />}
        Enregistrer tous les paramètres VIP
      </Button>
    </div>
  );
}
