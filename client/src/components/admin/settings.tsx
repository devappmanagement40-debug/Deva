import { useEffect, useState } from "react";
import { rebrandText } from "@/lib/content";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Link, Clock, Users, PowerOff, Power, HandCoins, Zap } from "lucide-react";
import { DEFAULT_REFERRAL_COMMISSION_RATES } from "@shared/referral-commission-settings";
import {
  DEFAULT_WITHDRAWAL_FEE_PERCENT,
  parseWithdrawalFeePercent,
} from "@shared/withdrawal-fees";

const commissionRateSchema = z.string()
  .trim()
  .min(1, "Commission requise")
  .refine(value => {
    const rate = Number(value);
    return Number.isFinite(rate) && rate >= 0 && rate <= 100;
  }, "Saisissez un taux entre 0 et 100");

const withdrawalFeeSchema = z.string()
  .trim()
  .min(1, "Taux requis")
  .refine(
    (value) => parseWithdrawalFeePercent(value) !== null,
    "Saisissez un taux entre 0 et 99 %, avec au plus 2 décimales",
  );

const NETWORKS = [
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
];

const settingsSchema = z.object({
  supportLink: z.string().trim(),
  supportType: z.string().trim(),
  supportLabel: z.string().trim(),
  support2Link: z.string().trim(),
  support2Type: z.string().trim(),
  support2Label: z.string().trim(),
  channelLink: z.string().trim(),
  channelType: z.string().trim(),
  channelLabel: z.string().trim(),
  groupLink: z.string().trim(),
  groupType: z.string().trim(),
  groupLabel: z.string().trim(),
  popupButtonLabel: z.string().min(1, "Label requis"),
  floatingSupportTarget: z.string().min(1, "Requis"),
  supportEnabled: z.boolean(),
  support2Enabled: z.boolean(),
  channelEnabled: z.boolean(),
  groupEnabled: z.boolean(),
  minDeposit: z.string().min(1, "Montant requis"),
  depositPresetAmounts: z.string().min(1, "Montants requis"),
  minWithdrawal: z.string().min(1, "Montant requis"),
  withdrawalFees: withdrawalFeeSchema,
  maxWithdrawal: z.string().min(1, "Montant requis"),
  withdrawalEnabled: z.boolean(),
  maxWithdrawalsPerDay: z.string().min(1, "Requis"),
  withdrawalInstructions: z.string().optional(),
  withdrawalDays: z.string().min(1, "Jours requis"),
  withdrawalStartHour: z.string().min(1, "Heure requise"),
  withdrawalEndHour: z.string().min(1, "Heure requise"),
  level1Commission: commissionRateSchema,
  level2Commission: commissionRateSchema,
  level3Commission: commissionRateSchema,
  // WestPay
  westpayMerchantSlug: z.string().optional(),
  westpayWebhookSecret: z.string().optional(),
  westpayApiKey_CI: z.string().optional(),
  westpayApiKey_BF: z.string().optional(),
  westpayApiKey_BJ: z.string().optional(),
  westpayApiKey_TG: z.string().optional(),
  westpayApiKey_CM: z.string().optional(),
  westpayApiKey_ML: z.string().optional(),
  // Popup d'accueil
  popupTitle: z.string().optional(),
  popupTelegramLabel: z.string().optional(),
  popupConfirmLabel: z.string().optional(),
  popupLine1: z.string().optional(),
  popupLine2: z.string().optional(),
  popupLine3: z.string().optional(),
  popupLine4: z.string().optional(),
  popupLine5: z.string().optional(),
  popupLine6: z.string().optional(),
  popupLine7: z.string().optional(),
}).superRefine((data, ctx) => {
  const links = [
    { enabled: data.supportEnabled, link: data.supportLink, type: data.supportType, label: data.supportLabel, prefix: "support" },
    { enabled: data.support2Enabled, link: data.support2Link, type: data.support2Type, label: data.support2Label, prefix: "support2" },
    { enabled: data.channelEnabled, link: data.channelLink, type: data.channelType, label: data.channelLabel, prefix: "channel" },
    { enabled: data.groupEnabled, link: data.groupLink, type: data.groupType, label: data.groupLabel, prefix: "group" },
  ];

  for (const item of links) {
    if (!item.enabled) continue;
    if (item.link.length < 5) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [`${item.prefix}Link`], message: "Lien requis pour un lien actif" });
    }
    if (!item.type) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [`${item.prefix}Type`], message: "Réseau social requis pour un lien actif" });
    }
    if (!item.label) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [`${item.prefix}Label`], message: "Label requis pour un lien actif" });
    }
  }
});

type SettingsForm = z.infer<typeof settingsSchema>;

// ── Composant toggle mode retrait ──────────────────────────────────────────
function WithdrawalModeToggle() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });
  const [toggling, setToggling] = useState(false);

  const currentMode = settings?.withdrawalMode || "manual";

  const toggle = async () => {
    const newMode = currentMode === "manual" ? "semi_auto" : "manual";
    setToggling(true);
    try {
      const response = await apiRequest("POST", "/api/admin/settings", { withdrawalMode: newMode });
      if (!response.ok) throw new Error("Erreur serveur");
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: newMode === "manual"
          ? "✋ Mode Manuel activé"
          : "⚡ Mode Semi-automatique NOWPayments activé",
        description: newMode === "manual"
          ? "Vous devrez valider chaque retrait manuellement."
          : "L'administrateur déclenche le payout puis valide le code 2FA NOWPayments.",
      });
    } catch (e: any) {
      toast({ title: e.message || "Erreur", variant: "destructive" });
    } finally {
      setToggling(false);
    }
  };

  if (isLoading) return null;

  const isManual = currentMode === "manual";

  return (
    <div className={`rounded-lg border-2 p-4 space-y-3 ${isManual ? "border-orange-400/60 bg-orange-50/40 dark:bg-orange-950/20" : "border-blue-400/60 bg-blue-50/40 dark:bg-blue-950/20"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isManual
            ? <HandCoins className="w-5 h-5 text-orange-500" />
            : <Zap className="w-5 h-5 text-blue-500" />}
          <p className="text-sm font-semibold">Mode de traitement des retraits</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isManual ? "bg-orange-500/20 text-orange-700 dark:text-orange-300" : "bg-blue-500/20 text-blue-700 dark:text-blue-300"}`}>
          {isManual ? "MANUEL" : "SEMI-AUTOMATIQUE (NOWPayments)"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {isManual
          ? "✋ Les retraits restent en attente jusqu'à votre validation manuelle dans le panel."
          : "⚡ Les demandes restent en attente. L'administrateur lance NOWPayments, puis confirme le code 2FA."}
      </p>
      <Button
        type="button"
        variant="outline"
        className={`w-full ${isManual ? "border-blue-400 text-blue-600 hover:bg-blue-50" : "border-orange-400 text-orange-600 hover:bg-orange-50"}`}
        disabled={toggling}
        onClick={toggle}
      >
        {toggling
          ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
          : isManual
            ? <><Zap className="w-4 h-4 mr-2" />Passer en mode Semi-automatique (NOWPayments)</>
            : <><HandCoins className="w-4 h-4 mr-2" />Passer en mode Manuel</>}
      </Button>
    </div>
  );
}

interface AdminSettingsProps {
  isSuperAdmin: boolean;
}

export default function AdminSettings({ isSuperAdmin }: AdminSettingsProps) {
  const { toast } = useToast();

  // ── Mode Maintenance ──────────────────────────────────────────────────────
  const [maintenanceToggling, setMaintenanceToggling] = useState(false);

  const toggleMaintenance = async (enable: boolean) => {
    setMaintenanceToggling(true);
    try {
      const response = await apiRequest("POST", "/api/admin/settings", {
        maintenanceMode: String(enable),
      });
      if (!response.ok) throw new Error("Erreur serveur");
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: enable ? "🔴 Site mis hors service" : "🟢 Site remis en ligne",
        description: enable
          ? "Le site est maintenant invisible pour les visiteurs."
          : "Le site est de nouveau accessible.",
      });
    } catch (e: any) {
      toast({ title: e.message || "Une erreur est survenue", variant: "destructive" });
    } finally {
      setMaintenanceToggling(false);
    }
  };

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      supportLink: "",
      supportType: "telegram",
      supportLabel: "Service client",
      support2Link: "",
      support2Type: "telegram",
      support2Label: "Service client 2",
      channelLink: "",
      channelType: "telegram",
      channelLabel: "Chaîne officielle",
      groupLink: "",
      groupType: "telegram",
      groupLabel: "Groupe de discussion",
      popupButtonLabel: "Cliquez ici pour rejoindre le groupe Telegram",
      popupTitle: "Plate-forme",
      popupTelegramLabel: "Groupes Telegram",
      popupConfirmLabel: "OK",
      floatingSupportTarget: "support1",
      supportEnabled: true,
      support2Enabled: false,
      channelEnabled: true,
      groupEnabled: false,
      minDeposit: "2500",
      depositPresetAmounts: "2500,5000,7000,10000,15000,20000,50000,70000",
      minWithdrawal: "1000",
      withdrawalFees: String(DEFAULT_WITHDRAWAL_FEE_PERCENT),
      maxWithdrawal: "1000000",
      withdrawalEnabled: true,
      maxWithdrawalsPerDay: "1",
      withdrawalInstructions: "",
      withdrawalDays: "1,2,3,4,5",
      withdrawalStartHour: "9",
      withdrawalEndHour: "17",
      level1Commission: DEFAULT_REFERRAL_COMMISSION_RATES.level1Commission,
      level2Commission: DEFAULT_REFERRAL_COMMISSION_RATES.level2Commission,
      level3Commission: DEFAULT_REFERRAL_COMMISSION_RATES.level3Commission,
      westpayMerchantSlug: "",
      westpayWebhookSecret: "",
      westpayApiKey_CI: "",
      westpayApiKey_BF: "",
      westpayApiKey_BJ: "",
      westpayApiKey_TG: "",
      westpayApiKey_CM: "",
      westpayApiKey_ML: "",
    },
  });

  useEffect(() => {
    if (!settings) return;
    // On utilise ?? (et non ||) pour que les valeurs vides sauvegardées en base
    // ne soient pas écrasées par les valeurs codées en dur ci-dessous.
    form.reset({
      supportLink:            settings.supportLink            ?? "",
      supportType:            settings.supportType            ?? "telegram",
      supportLabel:           settings.supportLabel           ?? "",
      support2Link:           settings.support2Link           ?? "",
      support2Type:           settings.support2Type           ?? "telegram",
      support2Label:          settings.support2Label          ?? "",
      channelLink:            settings.channelLink            ?? "",
      channelType:            settings.channelType            ?? "telegram",
      channelLabel:           settings.channelLabel           ?? "",
      groupLink:              settings.groupLink              ?? "",
      groupType:              settings.groupType              ?? "telegram",
      groupLabel:             settings.groupLabel             ?? "",
      popupButtonLabel:       settings.popupButtonLabel       ?? "",
      floatingSupportTarget:  settings.floatingSupportTarget  ?? "support1",
      supportEnabled:         settings.supportEnabled         !== "false",
      support2Enabled:        settings.support2Enabled        !== "false",
      channelEnabled:         settings.channelEnabled         !== "false",
      groupEnabled:           settings.groupEnabled           !== "false",
      minDeposit:             settings.minDeposit             ?? "2500",
      depositPresetAmounts:   settings.depositPresetAmounts   ?? "2500,5000,7000,10000,15000,20000,50000,70000",
      minWithdrawal:          settings.minWithdrawal          ?? "1000",
      withdrawalFees:         settings.withdrawalFees         ?? String(DEFAULT_WITHDRAWAL_FEE_PERCENT),
      maxWithdrawal:          settings.maxWithdrawal          ?? "1000000",
      withdrawalEnabled:      settings.withdrawalEnabled      !== "false",
      maxWithdrawalsPerDay:   settings.maxWithdrawalsPerDay   ?? "1",
      withdrawalInstructions: settings.withdrawalInstructions ?? "",
      withdrawalDays:         settings.withdrawalDays         ?? "1,2,3,4,5",
      withdrawalStartHour:    settings.withdrawalStartHour    ?? "9",
      withdrawalEndHour:      settings.withdrawalEndHour      ?? "17",
      level1Commission:       settings.level1Commission       ?? DEFAULT_REFERRAL_COMMISSION_RATES.level1Commission,
      level2Commission:       settings.level2Commission       ?? DEFAULT_REFERRAL_COMMISSION_RATES.level2Commission,
      level3Commission:       settings.level3Commission       ?? DEFAULT_REFERRAL_COMMISSION_RATES.level3Commission,
      popupTitle:             rebrandText(settings.popupTitle ?? ""),
      popupTelegramLabel:     settings.popupTelegramLabel     ?? "",
      popupConfirmLabel:      settings.popupConfirmLabel      ?? "",
       popupLine1:             rebrandText(settings.popupLine1 || "🚀 DIAMANT RDC : lancement officiel le 03/09/2026 !"),
       popupLine2:             rebrandText(settings.popupLine2 || "🤝 Dépôt minimum : 2 500 XOF — Mobile Money et USDT BEP20"),
       popupLine3:             rebrandText(settings.popupLine3 || "💚 Retrait minimum : 1 000 XOF — 12 % retenus sur le montant saisi"),
        popupLine4:             rebrandText(settings.popupLine4 ?? ""),
       popupLine5:             rebrandText(settings.popupLine5 || "👥 Invitez vos amis et gagnez des commissions"),
       popupLine6:             rebrandText(settings.popupLine6 || "🕘 Retraits et support disponibles de 09:00 à 17:00"),
       popupLine7:             rebrandText(settings.popupLine7 || "🔥 Les gains sont crédités automatiquement à la fin du cycle du produit"),
      westpayMerchantSlug:    settings.westpayMerchantSlug    ?? "",
      westpayWebhookSecret:   settings.westpayWebhookSecret   ?? "",
      westpayApiKey_CI:       settings.westpayApiKey_CI       ?? "",
      westpayApiKey_BF:       settings.westpayApiKey_BF       ?? "",
      westpayApiKey_BJ:       settings.westpayApiKey_BJ       ?? "",
      westpayApiKey_TG:       settings.westpayApiKey_TG       ?? "",
      westpayApiKey_CM:       settings.westpayApiKey_CM       ?? "",
      westpayApiKey_ML:       settings.westpayApiKey_ML       ?? "",
    });
  // "form" est intentionnellement absent des dépendances : l'objet change à
  // chaque render et provoquerait une boucle infinie de réinitialisations.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const serialized = {
        ...data,
        supportEnabled: String(data.supportEnabled),
        support2Enabled: String(data.support2Enabled),
        channelEnabled: String(data.channelEnabled),
        groupEnabled: String(data.groupEnabled),
        withdrawalEnabled: String(data.withdrawalEnabled),
      };
      const response = await apiRequest("POST", "/api/admin/settings", serialized);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Erreur");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/links"] });
      toast({ title: "Paramètres enregistrés !" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Une erreur est survenue", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  const isMaintenance = settings?.maintenanceMode === "true";
  const supportEnabled = form.watch("supportEnabled");
  const support2Enabled = form.watch("support2Enabled");
  const channelEnabled = form.watch("channelEnabled");
  const groupEnabled = form.watch("groupEnabled");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">

        {/* ── Mode Maintenance ── */}
        <Card className={isMaintenance ? "border-red-500 bg-red-950/40" : "border-gray-700/50 bg-gray-950/20"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {isMaintenance
                ? <PowerOff className="w-5 h-5 text-red-400" />
                : <Power className="w-5 h-5 text-gray-400" />}
              <span className={isMaintenance ? "text-red-300" : "text-gray-300"}>
                Mode maintenance
              </span>
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                isMaintenance ? "bg-red-500/30 text-red-300" : "bg-black/30 text-gray-300"
              }`}>
                {isMaintenance ? "En maintenance" : "En ligne"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-400">
              {isMaintenance
                ? "⚠️ Le site est actuellement hors service. Les visiteurs voient une page blanche vide. Seul le panel admin reste accessible."
                : "Le site est accessible normalement. Cliquez sur le bouton pour le mettre hors service instantanément."}
            </p>
            <div className="flex gap-2">
              {isMaintenance ? (
                <Button
                  type="button"
                  className="w-full bg-black hover:bg-gray-900 text-white"
                  disabled={maintenanceToggling}
                  onClick={() => toggleMaintenance(false)}
                >
                  {maintenanceToggling
                    ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    : <Power className="w-4 h-4 mr-2" />}
                  Remettre le site en ligne
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  disabled={maintenanceToggling}
                  onClick={() => toggleMaintenance(true)}
                >
                  {maintenanceToggling
                    ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    : <PowerOff className="w-4 h-4 mr-2" />}
                  Mettre le site hors service
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Liens & Réseaux sociaux ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              Liens & Réseaux sociaux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Support 1 */}
            <div className={`space-y-2 rounded-xl border p-3 ${supportEnabled ? "" : "bg-muted/30 opacity-70"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Lien 1 — Service client 1</p>
                  {!supportEnabled && <p className="mt-1 text-xs text-muted-foreground">Désactivé : aucune configuration requise</p>}
                </div>
                <FormField control={form.control} name="supportEnabled" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Inactif"}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) form.clearErrors(["supportLink", "supportType", "supportLabel"]);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="supportLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom affiché</FormLabel>
                    <FormControl><Input {...field} placeholder="Support" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="supportType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réseau social</FormLabel>
                    <Select disabled={!supportEnabled} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NETWORKS.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="supportLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL du lien</FormLabel>
                  <FormControl><Input {...field} disabled={!supportEnabled} placeholder="https://t.me/..." /></FormControl>
                  <FormDescription>Pour un nom d’utilisateur Telegram, utilisez https://t.me/nom sans le caractère @ dans l’URL.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Support 2 */}
            <div className={`space-y-2 rounded-xl border p-3 ${support2Enabled ? "" : "bg-muted/30 opacity-70"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Lien 2 — Service client 2</p>
                  {!support2Enabled && <p className="mt-1 text-xs text-muted-foreground">Désactivé : aucune configuration requise</p>}
                </div>
                <FormField control={form.control} name="support2Enabled" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Inactif"}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) form.clearErrors(["support2Link", "support2Type", "support2Label"]);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="support2Label" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom affiché</FormLabel>
                    <FormControl><Input {...field} placeholder="Support 2" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="support2Type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réseau social</FormLabel>
                    <Select disabled={!support2Enabled} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NETWORKS.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="support2Link" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL du lien</FormLabel>
                  <FormControl><Input {...field} disabled={!support2Enabled} placeholder="https://t.me/..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Channel */}
            <div className={`space-y-2 rounded-xl border p-3 ${channelEnabled ? "" : "bg-muted/30 opacity-70"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Lien 3 — Chaîne officielle</p>
                  {!channelEnabled && <p className="mt-1 text-xs text-muted-foreground">Désactivé : aucune configuration requise</p>}
                </div>
                <FormField control={form.control} name="channelEnabled" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Inactif"}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) form.clearErrors(["channelLink", "channelType", "channelLabel"]);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="channelLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom affiché</FormLabel>
                    <FormControl><Input {...field} placeholder="Canal officiel" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="channelType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réseau social</FormLabel>
                    <Select disabled={!channelEnabled} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NETWORKS.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="channelLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL du lien</FormLabel>
                  <FormControl><Input {...field} disabled={!channelEnabled} placeholder="https://t.me/..." /></FormControl>
                  <FormDescription>Nom public : https://t.me/nom. Un lien d’invitation peut garder le format https://t.me/+code.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Group */}
            <div className={`space-y-2 rounded-xl border p-3 ${groupEnabled ? "" : "bg-muted/30 opacity-70"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Lien 4 — Groupe de discussion</p>
                  {!groupEnabled && <p className="mt-1 text-xs text-muted-foreground">Désactivé : aucune configuration requise</p>}
                </div>
                <FormField control={form.control} name="groupEnabled" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-xs text-gray-500">{field.value ? "Actif" : "Inactif"}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (!checked) form.clearErrors(["groupLink", "groupType", "groupLabel"]);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="groupLabel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom affiché</FormLabel>
                    <FormControl><Input {...field} placeholder="Groupe" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="groupType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Réseau social</FormLabel>
                    <Select disabled={!groupEnabled} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NETWORKS.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="groupLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL du lien</FormLabel>
                  <FormControl><Input {...field} disabled={!groupEnabled} placeholder="https://t.me/..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Bouton flottant service client */}
            <div className="border border-blue-400 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                <p className="text-sm font-semibold text-blue-600">Bouton flottant service client</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Le bouton rond avec l'avatar qui flotte sur l'écran. Choisissez vers quel lien il redirige l'utilisateur.
              </p>
              <FormField control={form.control} name="floatingSupportTarget" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien du bouton flottant</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un service client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="support1">Service client 1</SelectItem>
                        <SelectItem value="support2">Service client 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    "Service client 1" ou "Service client 2" selon le lien configuré ci-dessus.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Popup dashboard button */}
            <div className="border border-red-500 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <p className="text-sm font-semibold text-red-600">Bouton popup page d'accueil</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Ce bouton apparaît dans la fenêtre popup automatique de la page d'accueil.
              </p>
              <FormField control={form.control} name="popupButtonLabel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Texte du bouton <span className="text-red-500">(popup accueil)</span></FormLabel>
                  <FormControl><Input {...field} placeholder="Ex : Rejoindre le groupe Telegram" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="groupLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lien du bouton <span className="text-red-500">(popup accueil)</span></FormLabel>
                  <FormControl><Input {...field} disabled={!groupEnabled} placeholder="https://t.me/..." /></FormControl>
                  <FormDescription>
                    {groupEnabled
                      ? "Ce lien est aussi utilisé dans le popup de bienvenue."
                      : "Le groupe est désactivé : ce lien n'a pas besoin d'être configuré."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

          </CardContent>
        </Card>

        {/* ── Retraits & Bonus ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Retraits & Commissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-foreground">Mode de retrait actuel</p>
              <p className="mt-1 text-lg font-bold text-primary">USDT BEP20</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Méthode unique disponible. L'utilisateur doit fournir un numéro Mobile Money.
              </p>
              <FormField control={form.control} name="withdrawalEnabled" render={({ field }) => (
                <FormItem className="mt-3 flex items-center justify-between rounded-md border bg-background/60 p-3 space-y-0">
                  <div>
                    <FormLabel>Autoriser les retraits</FormLabel>
                    <FormDescription>
                      {field.value ? "Les utilisateurs peuvent soumettre des demandes de retrait." : "Les nouvelles demandes de retrait sont désactivées."}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            {/* Mode de traitement des retraits */}
            <WithdrawalModeToggle />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="minDeposit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Recharge minimum (XOF)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="depositPresetAmounts" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Montants rapides de recharge (XOF)</FormLabel>
                  <FormControl><Input {...field} placeholder="2500,5000,7000,10000,15000,20000,50000,70000" /></FormControl>
                  <FormDescription>Liste de montants séparés par des virgules, affichés comme boutons rapides sur la page de recharge.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="minWithdrawal" render={({ field }) => (
                <FormItem>
                  <FormLabel>Retrait minimum (XOF)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="withdrawalFees" render={({ field }) => (
                <FormItem>
                  <FormLabel>Frais de retrait (%)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="99" step="0.01" /></FormControl>
                  <FormDescription>
                    Retenus sur le montant saisi. À 12 %, un retrait de 10 000 XOF verse 8 800 XOF.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="maxWithdrawal" render={({ field }) => (
                <FormItem>
                  <FormLabel>Retrait maximum (XOF)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField control={form.control} name="maxWithdrawalsPerDay" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nb. max de retraits par jour</FormLabel>
                  <FormControl><Input {...field} type="number" min="1" max="10" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="withdrawalInstructions" render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions de retrait (affichées sur la page de retrait)</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={6}
                    placeholder={"1. Le montant minimum de retrait est de 1 000 XOF\n2. Des frais sont retenus sur le montant demandé\n3. Choisissez Mobile Money ou USDT BEP20 selon les options disponibles\n4. Maximum 1 retrait par jour"}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                  />
                </FormControl>
                <FormDescription>
                  Laissez vide pour utiliser les instructions générées automatiquement. Chaque ligne sera affichée séparément.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            {/* Jours autorisés */}
            <FormField control={form.control} name="withdrawalDays" render={({ field }) => {
              const DAYS = [
                { value: "1", label: "Lun" },
                { value: "2", label: "Mar" },
                { value: "3", label: "Mer" },
                { value: "4", label: "Jeu" },
                { value: "5", label: "Ven" },
                { value: "6", label: "Sam" },
                { value: "0", label: "Dim" },
              ];
              const selected = new Set((field.value || "").split(",").map(s => s.trim()).filter(Boolean));
              const toggle = (v: string) => {
                const next = new Set(selected);
                next.has(v) ? next.delete(v) : next.add(v);
                field.onChange(Array.from(next).join(","));
              };
              return (
                <FormItem>
                  <FormLabel>Jours autorisés pour les retraits</FormLabel>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {DAYS.map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggle(d.value)}
                        className="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
                        style={{
                          background: selected.has(d.value) ? "hsl(var(--primary))" : "transparent",
                          color: selected.has(d.value) ? "white" : "hsl(var(--foreground))",
                          borderColor: selected.has(d.value) ? "hsl(var(--primary))" : "hsl(var(--border))",
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <FormDescription>Cliquez pour activer / désactiver un jour.</FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="withdrawalStartHour" render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure de début (0–23)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="23" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="withdrawalEndHour" render={({ field }) => (
                <FormItem>
                  <FormLabel>Heure de fin (0–23)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="23" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* ── Commissions sur investissements ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Commissions de parrainage — Investissements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Ces taux sont crédités sur les achats de produits des filleuls. Vous pouvez modifier chaque niveau ici.</p>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="level1Commission" render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau 1 (%)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="100" step="0.01" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="level2Commission" render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau 2 (%)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="100" step="0.01" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="level3Commission" render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau 3 (%)</FormLabel>
                  <FormControl><Input {...field} type="number" min="0" max="100" step="0.01" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* ── Popup d'accueil ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              🔔 Popup d'accueil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-400">
              Personnalisez tous les textes du popup qui s'affiche à l'ouverture de l'application. Laissez un champ vide pour utiliser la valeur par défaut.
            </p>
            {([
              { name: "popupTitle" as const, label: "Titre du popup", placeholder: "Plate-forme" },
              { name: "popupTelegramLabel" as const, label: "Texte du bouton Telegram", placeholder: "Groupes Telegram" },
              { name: "popupConfirmLabel" as const, label: "Texte du bouton de confirmation", placeholder: "OK" },
            ]).map(({ name, label, placeholder }) => (
              <FormField key={name} control={form.control} name={name} render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={placeholder} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
            {([
              { name: "popupLine1" as const, label: "Ligne 1 — Date de lancement", placeholder: "🚀 DIAMANT RDC : lancement officiel le 03/09/2026 !" },
              { name: "popupLine2" as const, label: "Ligne 2 — Dépôt minimum", placeholder: "🤝 Dépôt minimum : 2 500 XOF — Mobile Money et USDT BEP20" },
              { name: "popupLine3" as const, label: "Ligne 3 — Retrait minimum", placeholder: "💚 Retrait minimum : 1 000 XOF — 12 % retenus sur le montant saisi" },
              { name: "popupLine4" as const, label: "Ligne 4 — Message complémentaire", placeholder: "Message d'information complémentaire" },
              { name: "popupLine5" as const, label: "Ligne 5 — Parrainage", placeholder: "👥 Invite your friends and earn commissions" },
              { name: "popupLine6" as const, label: "Ligne 6 — Horaires", placeholder: "🕘 Withdrawals and support: 09:00–17:00" },
              { name: "popupLine7" as const, label: "Ligne 7 — Gains", placeholder: "🔥 Product earnings are automatically credited at the end of the cycle" },
            ]).map(({ name, label, placeholder }) => (
              <FormField key={name} control={form.control} name={name} render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={2}
                      placeholder={placeholder}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
          </CardContent>
        </Card>

        {/* ── WestPay ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              💳 WestPay — Dépôts automatiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-400">
              Configurez votre compte WestPay pour activer les dépôts automatiques Mobile Money.
              Le slug marchand se trouve dans votre tableau de bord WestPay.
              Le secret webhook est généré automatiquement à la création de votre URL webhook.
            </p>
            <FormField control={form.control} name="westpayMerchantSlug" render={({ field }) => (
              <FormItem>
                <FormLabel>Slug marchand WestPay</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="ex : diamant" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="westpayWebhookSecret" render={({ field }) => (
              <FormItem>
                <FormLabel>Secret webhook WestPay (HMAC-SHA256)</FormLabel>
                <FormControl>
                  <Input {...field} type="password" placeholder="Secret copié depuis le dashboard WestPay" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <p className="text-[11px] text-gray-500 leading-5">
              URL webhook à configurer dans WestPay :{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 break-all">
                https://votre-domaine.com/api/webhook/westpay
              </code>
            </p>

            {/* Clés API par pays */}
            <p className="text-xs font-semibold text-gray-600 pt-1">Clés API par pays</p>
            <p className="text-xs text-gray-400">
              Chaque pays possède sa propre clé API WestPay (disponible dans votre dashboard WestPay → API Keys).
            </p>
            {([
              { name: "westpayApiKey_CI" as const, label: "🇨🇮 Côte d'Ivoire" },
              { name: "westpayApiKey_BF" as const, label: "🇧🇫 Burkina Faso" },
              { name: "westpayApiKey_BJ" as const, label: "🇧🇯 Bénin" },
              { name: "westpayApiKey_TG" as const, label: "🇹🇬 Togo" },
              { name: "westpayApiKey_CM" as const, label: "🇨🇲 Cameroun" },
              { name: "westpayApiKey_ML" as const, label: "🇲🇱 Mali (WestPay uniquement)" },
            ]).map(({ name, label }) => (
              <FormField key={name} control={form.control} name={name} render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Clé API WestPay" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les paramètres
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
