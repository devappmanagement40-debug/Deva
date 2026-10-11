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

export default function AdminVipSettings() {
  const { toast } = useToast();
  const { data: settings = {}, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const [form, setForm] = useState<Record<string, string>>({});

  const legacyVipCopy: Record<string, string | string[]> = {
    vip0Description: [
      "Membre inscrit n'ayant pas encore investi.",
      "Membre n'ayant pas encore acheté de produit Parcours.",
      "Membre dont l’investissement personnel cumulé n’a pas encore atteint le seuil configuré pour VIP 1.",
    ],
    vip0Advantages: "Accès à la plateforme. Possibilité de déposer et d'investir.",
    vip1Description: [
      "Nouveau membre ayant réalisé son premier investissement.",
      "Membre ayant réalisé son premier achat personnel payant dans Parcours.",
      "Seuil d’investissement personnel cumulé configuré pour VIP 1 atteint.",
    ],
    vip1Advantages: [
      "Accès complet à la plateforme. Gains quotidiens. Commissions de parrainage actives.",
      "Rang d'entrée pour l'accès aux produits Parcours.",
    ],
    vip2Description: [
      "Seuil d'investissement personnel cumulé dans Parcours atteint.",
      "Membre actif avec 3 filleuls directs (niveau A).",
      "Seuil d'investissement personnel cumulé sur l’ensemble des produits payants atteint.",
    ],
    vip2Advantages: ["Statut VIP 2. Reconnaissance de votre activité de recrutement.", "Accès aux produits Parcours dont le niveau VIP requis est atteint."],
    vip3Description: [
      "Seuil d'investissement personnel cumulé dans Parcours atteint.",
      "Minimum 3 membres directs (A) ayant commencé à construire leur propre réseau (niveau B).",
      "Seuil d'investissement personnel cumulé sur l’ensemble des produits payants atteint.",
    ],
    vip3Advantages: ["Statut VIP 3. Équipe structurée sur 2 niveaux.", "Accès aux produits Parcours dont le niveau VIP requis est atteint."],
    vip4Description: [
      "Seuil d'investissement personnel cumulé dans Parcours atteint.",
      "Minimum 100 membres dans l'équipe totale (niveaux A + B + C).",
      "Seuil d'investissement personnel cumulé sur l’ensemble des produits payants atteint.",
    ],
    vip4Advantages: ["Statut VIP 4. Leader d'équipe confirmé.", "Accès aux produits Parcours dont le niveau VIP requis est atteint."],
    vip5Description: [
      "Seuil d'investissement personnel cumulé dans Parcours atteint.",
      "Minimum 300 membres dans l'équipe totale.",
      "Seuil d'investissement personnel cumulé sur l’ensemble des produits payants atteint.",
    ],
    vip5Advantages: ["Statut VIP 5. Ambassadeur de la plateforme.", "Accès aux produits Parcours dont le niveau VIP requis est atteint."],
    vip6Description: [
      "Seuil d'investissement personnel cumulé dans Parcours atteint.",
      "Minimum 600 membres dans l'équipe totale.",
      "Seuil d'investissement personnel cumulé sur l’ensemble des produits payants atteint.",
    ],
    vip6Advantages: ["Statut VIP 6. Partenaire élite.", "Accès aux produits Parcours dont le niveau VIP requis est atteint."],
    vip7Description: [
      "Seuil d'investissement personnel cumulé dans Parcours atteint.",
      "Minimum 1 000 membres dans l'équipe totale.",
      "Seuil d'investissement personnel cumulé sur l’ensemble des produits payants atteint.",
    ],
    vip7Advantages: ["Statut VIP 7. Rang suprême. Reconnaissance maximale.", "Accès aux produits Parcours dont le niveau VIP requis est atteint."],
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
          Le premier achat Parcours attribue VIP 1; les achats suivants attribuent le rang de leur position dans le catalogue. Explore et Offres comptent dans les montants requis par les fiches Parcours, mais ne donnent pas de rang VIP.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Configurez le montant cumulatif requis sur chaque fiche dans la gestion des produits. Les descriptions et avantages ci-dessous modifient uniquement les textes présentés aux membres.
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
