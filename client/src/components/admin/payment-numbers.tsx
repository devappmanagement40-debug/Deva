import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCountryFlagEmoji } from "@/lib/countries";
import PaymentQrUploader from "@/components/admin/payment-qr-uploader";
import { isPaymentQrDataUrl } from "@/lib/payment-qr-image";
import { Plus, Edit, Trash2, Phone, Loader2, Eye, EyeOff, ExternalLink } from "lucide-react";
import type { PaymentNumber } from "@shared/schema";

interface Country {
  id: number;
  code: string;
  name: string;
  currency: string;
  phonePrefix: string;
  isActive: boolean;
}

const emptyForm = {
  ownerName: "",
  phone: "",
  operatorName: "",
  country: "",
  logoUrl: "",
  paymentRecipientLabel: "",
  paymentBadgeLabel: "",
  ussdTemplate: "",
  paymentUrl: "",
  paymentQrDataUrl: "",
  isActive: true,
};

function getSafePaymentHref(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return ["https:", "wave:"].includes(parsed.protocol) ? trimmed : null;
  } catch {
    return null;
  }
}

export default function AdminPaymentNumbers() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<PaymentNumber | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [manualCountry, setManualCountry] = useState(false);
  const [manualCountryInput, setManualCountryInput] = useState("");

  const { data: numbers = [], isLoading } = useQuery<PaymentNumber[]>({
    queryKey: ["/api/admin/payment-numbers"],
  });

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/admin/countries"],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const country = (manualCountry ? manualCountryInput : form.country).toUpperCase().trim();
      const payload = {
        ...form,
        country,
        paymentUrl: country === "CI" ? form.paymentUrl : "",
        paymentQrDataUrl: country === "CI" ? form.paymentQrDataUrl : "",
        operatorName: country === "CI" ? "Wave" : form.operatorName,
        paymentRecipientLabel: country === "TG" ? form.paymentRecipientLabel : "",
        paymentBadgeLabel: country === "TG" ? form.paymentBadgeLabel : "",
        ussdTemplate: country === "TG" ? form.ussdTemplate : "",
      };
      if (!payload.country) throw new Error("Veuillez sélectionner ou saisir un pays");
      if (editTarget) {
        const res = await apiRequest("PUT", `/api/admin/payment-numbers/${editTarget.id}`, payload);
        if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Erreur"); }
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/payment-numbers", payload);
        if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Erreur"); }
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-numbers"] });
      toast({ title: editTarget ? "Numéro mis à jour" : "Numéro ajouté" });
      closeForm();
    },
    onError: (e: any) => toast({ title: e.message || "Une erreur est survenue", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/payment-numbers/${id}`, {});
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Erreur"); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-numbers"] });
      toast({ title: "Numéro supprimé" });
    },
    onError: (e: any) => toast({ title: e.message || "Une erreur est survenue", variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/payment-numbers/${id}`, { isActive });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Erreur"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-numbers"] });
    },
    onError: (e: any) => toast({ title: e.message || "Une erreur est survenue", variant: "destructive" }),
  });

  const openAdd = () => {
    setEditTarget(null);
    const defaultCountry = countries.length > 0 ? countries[0].code : "";
    setForm({ ...emptyForm, country: defaultCountry });
    setManualCountry(false);
    setManualCountryInput("");
    setShowForm(true);
  };

  const openEdit = (num: PaymentNumber) => {
    setEditTarget(num);
    const isKnown = countries.some(c => c.code === num.country);
    setManualCountry(!isKnown);
    setManualCountryInput(!isKnown ? num.country : "");
    setForm({
      ownerName: num.ownerName,
      phone: num.phone,
      operatorName: num.operatorName,
      country: isKnown ? num.country : "",
      logoUrl: num.logoUrl || "",
      paymentRecipientLabel: num.paymentRecipientLabel || "",
      paymentBadgeLabel: num.paymentBadgeLabel || "",
      ussdTemplate: num.ussdTemplate || "",
      paymentUrl: num.paymentUrl || "",
      paymentQrDataUrl: num.paymentQrDataUrl || "",
      isActive: num.isActive,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setForm(emptyForm);
    setManualCountry(false);
    setManualCountryInput("");
  };

  const grouped = numbers.reduce((acc, n) => {
    if (!acc[n.country]) acc[n.country] = [];
    acc[n.country].push(n);
    return acc;
  }, {} as Record<string, PaymentNumber[]>);

  const getCountryName = (code: string) => {
    const found = countries.find(c => c.code === code);
    return found ? found.name : code;
  };

  const showCiPaymentSettings = (
    manualCountry ? manualCountryInput : form.country
  ).trim().toUpperCase() === "CI";
  const showTogoPaymentSettings = (
    manualCountry ? manualCountryInput : form.country
  ).trim().toUpperCase() === "TG";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{numbers.length} numéro(s) configuré(s)</p>
        </div>
        <Button onClick={openAdd} data-testid="button-add-payment-number">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un numéro
        </Button>
      </div>

      {isLoading ? (
        Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)
      ) : numbers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Phone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun numéro configuré</p>
          <p className="text-xs mt-1">Ajoutez des numéros pour que les utilisateurs puissent déposer</p>
        </div>
      ) : (
        Object.entries(grouped).map(([country, nums]) => (
          <div key={country}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getCountryFlagEmoji(country) || "🌍"}</span>
              <h3 className="font-semibold text-foreground">{getCountryName(country)}</h3>
              <Badge variant="secondary">{nums.length}</Badge>
            </div>
            <div className="space-y-2 ml-2">
              {nums.map((num) => (
                <Card key={num.id} className={num.isActive ? "" : "opacity-60"}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {num.logoUrl ? (
                        <img src={num.logoUrl} alt={num.operatorName} className="w-12 h-12 rounded-xl object-contain border border-border" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                          <Phone className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">{num.operatorName}</p>
                          <Badge variant={num.isActive ? "default" : "secondary"} className="text-xs">
                            {num.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                        <p className="font-mono text-primary font-bold">{num.phone}</p>
                        <p className="text-sm text-muted-foreground">{num.ownerName}</p>
                        {num.country.trim().toUpperCase() === "CI" && (
                          <>
                            <p className="mt-1 break-all text-xs">
                              {getSafePaymentHref(num.paymentUrl) ? (
                                <a
                                  href={getSafePaymentHref(num.paymentUrl) || undefined}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={num.paymentUrl || undefined}
                                  className="inline-flex items-start gap-1 text-primary underline underline-offset-2"
                                  data-testid={`link-wave-payment-${num.id}`}
                                >
                                  <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                                  <span>{num.paymentUrl}</span>
                                </a>
                              ) : (
                                <span className="text-muted-foreground">
                                  {num.paymentUrl ? "Lien Wave invalide" : "Lien Wave non configuré"}
                                </span>
                              )}
                            </p>
                            {isPaymentQrDataUrl(num.paymentQrDataUrl) && (
                              <img
                                src={num.paymentQrDataUrl}
                                alt="Aperçu du QR Wave"
                                className="mt-2 h-14 w-14 rounded border border-border bg-white p-1 object-contain"
                              />
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost"
                          onClick={() => toggleActiveMutation.mutate({ id: num.id, isActive: !num.isActive })}
                          disabled={toggleActiveMutation.isPending}
                          data-testid={`button-toggle-active-${num.id}`}>
                          {num.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(num)} data-testid={`button-edit-${num.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive"
                          onClick={() => { if (confirm("Supprimer ce numéro ?")) deleteMutation.mutate(num.id); }}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${num.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Modifier le numéro" : "Ajouter un numéro de paiement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Pays</label>
              {!manualCountry ? (
                <div className="space-y-2 mt-1">
                  <select
                    value={form.country}
                    onChange={(e) => {
                      if (e.target.value === "__manual__") {
                        setManualCountry(true);
                        setForm(f => ({ ...f, country: "" }));
                      } else {
                        const country = e.target.value;
                        setForm(f => ({
                          ...f,
                          country,
                          ...(country.trim().toUpperCase() === "CI"
                            ? {}
                            : { paymentUrl: "", paymentQrDataUrl: "" }),
                        }));
                      }
                    }}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                    data-testid="select-country"
                  >
                    <option value="">-- Choisir un pays --</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>
                        {getCountryFlagEmoji(c.code) || "🌍"} {c.name} ({c.code})
                      </option>
                    ))}
                    <option value="__manual__">✏️ Saisir manuellement...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2 mt-1">
                  <Input
                    value={manualCountryInput}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setManualCountryInput(value);
                      if (value.trim() !== "CI") {
                        setForm(f => ({ ...f, paymentUrl: "", paymentQrDataUrl: "" }));
                      }
                    }}
                    placeholder="Code pays (ex: GA, SN...)"
                    maxLength={3}
                    className="flex-1"
                    data-testid="input-manual-country"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const country = countries[0]?.code || "";
                      setManualCountry(false);
                      setManualCountryInput("");
                      setForm(f => ({
                        ...f,
                        country,
                        ...(country.trim().toUpperCase() === "CI"
                          ? {}
                          : { paymentUrl: "", paymentQrDataUrl: "" }),
                      }));
                    }}
                  >
                    Liste
                  </Button>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">{showCiPaymentSettings ? "Opérateur de dépôt" : "Opérateur"}</label>
              {showCiPaymentSettings ? (
                <>
                  <Input value="Wave" disabled className="mt-1" data-testid="input-operator-name" />
                  <p className="mt-1 text-xs text-muted-foreground">En Côte d’Ivoire, seul Wave est utilisé pour les dépôts.</p>
                </>
              ) : (
                <Input value={form.operatorName} onChange={(e) => setForm(f => ({ ...f, operatorName: e.target.value }))}
                  placeholder="Ex: Airtel Money, Moov Money" className="mt-1" data-testid="input-operator-name" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Numéro de téléphone</label>
              <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Ex: +23599000000" className="mt-1" data-testid="input-phone" />
            </div>
            <div>
              <label className="text-sm font-medium">Nom du propriétaire</label>
              <Input value={form.ownerName} onChange={(e) => setForm(f => ({ ...f, ownerName: e.target.value }))}
                placeholder="Ex: Jean Dupont" className="mt-1" data-testid="input-owner-name" />
            </div>
            <div>
              <label className="text-sm font-medium">URL du logo <span className="text-muted-foreground font-normal">(optionnel)</span></label>
              <Input value={form.logoUrl} onChange={(e) => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://..." className="mt-1" data-testid="input-logo-url" />
              {form.logoUrl && (
                <img src={form.logoUrl} alt="logo" className="mt-2 h-10 object-contain rounded-lg border border-border" onError={(e) => (e.currentTarget.style.display = "none")} />
              )}
            </div>
            {showCiPaymentSettings && (
              <section className="space-y-3 rounded-lg border border-border p-3">
                <div>
                  <label className="text-sm font-medium">Lien de paiement Wave</label>
                  <Input
                    value={form.paymentUrl}
                    onChange={(e) => setForm(f => ({ ...f, paymentUrl: e.target.value }))}
                    placeholder="https://…"
                    className="mt-1"
                    data-testid="input-ci-payment-url"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Le dépôt Wave CI ouvre ce lien. Vous pouvez le modifier ici; les balises {"{amount}"}, {"{phone}"} et {"{currency}"} sont facultatives.
                  </p>
                </div>
                <PaymentQrUploader
                  value={form.paymentQrDataUrl}
                  onChange={paymentQrDataUrl => setForm(f => ({ ...f, paymentQrDataUrl }))}
                />
              </section>
            )}
            {showTogoPaymentSettings && (
              <section className="space-y-3 rounded-lg border border-border p-3">
                <div>
                  <label className="text-sm font-medium">Libellé du destinataire</label>
                  <Input
                    value={form.paymentRecipientLabel}
                    onChange={(e) => setForm(f => ({ ...f, paymentRecipientLabel: e.target.value }))}
                    placeholder={form.operatorName || "Yas Togo (Togocel)"}
                    className="mt-1"
                    data-testid="input-tg-recipient-label"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Badge du compte</label>
                  <Input
                    value={form.paymentBadgeLabel}
                    onChange={(e) => setForm(f => ({ ...f, paymentBadgeLabel: e.target.value }))}
                    placeholder="CARTE MARCHAND"
                    className="mt-1"
                    data-testid="input-tg-payment-badge"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Modèle du code USSD</label>
                  <Input
                    value={form.ussdTemplate}
                    onChange={(e) => setForm(f => ({ ...f, ussdTemplate: e.target.value }))}
                    placeholder="*145*5*{amount}*{number}#"
                    className="mt-1"
                    data-testid="input-tg-ussd-template"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Obligatoire pour le Togo. Balises disponibles : {"{amount}"}, {"{number}"} (bénéficiaire), {"{phone}"} (client), {"{currency}"} et {"{operator}"}.
                  </p>
                </div>
              </section>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <label htmlFor="isActive" className="text-sm font-medium">Actif (visible aux utilisateurs)</label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={closeForm}>Annuler</Button>
              <Button
                className="flex-1"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !form.ownerName || !form.phone || (!showCiPaymentSettings && !form.operatorName) || (showTogoPaymentSettings && !form.ussdTemplate.trim()) || (!manualCountry && !form.country) || (manualCountry && !manualCountryInput.trim())}
                data-testid="button-save-payment-number"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editTarget ? "Modifier" : "Ajouter")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
