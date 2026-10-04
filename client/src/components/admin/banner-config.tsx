/**
 * AdminBannerConfig — gestion des deux bannières défilantes de la page d'accueil.
 * Upload depuis la galerie via POST /api/admin/upload (pas de base64, pas d'URL manuelle).
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Trash2, Image as ImageIcon, Star, CheckCircle2, Pencil } from "lucide-react";
import ImageUploader from "@/components/admin/image-uploader";
import type { Product } from "@shared/schema";
import {
  ACCOUNT_BANNER_DEFAULT_IMAGES,
  HOME_BANNER_DEFAULT_IMAGES,
} from "@/lib/banner-defaults";
import { parseBannerImages, serializeBannerImages } from "@/lib/banner-images";

/* ── Mini preview card ──────────────────────────────────────────────────── */
function ThumbCard({
  url,
  idx,
  total,
  onMoveUp,
  onMoveDown,
  onReplace,
  onRemove,
}: {
  url: string;
  idx: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onReplace: (url: string) => void;
  onRemove: () => void;
}) {
  const [ok, setOk] = useState(true);
  const [replacing, setReplacing] = useState(false);
  return (
    <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
      {ok ? (
        <img
          src={url}
          onError={() => setOk(false)}
          className="w-full rounded-lg object-cover"
          style={{ height: 80 }}
          alt=""
        />
      ) : (
        <div className="w-full rounded-lg flex items-center justify-center bg-muted" style={{ height: 80 }}>
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="flex-1 text-xs font-mono text-muted-foreground truncate">{url}</span>
        <div className="flex gap-1 shrink-0">
          <button type="button" onClick={onMoveUp} disabled={idx === 0} className="text-xs px-1.5 py-0.5 rounded border disabled:opacity-30 hover:bg-muted" title="Monter">↑</button>
          <button type="button" onClick={onMoveDown} disabled={idx === total - 1} className="text-xs px-1.5 py-0.5 rounded border disabled:opacity-30 hover:bg-muted" title="Descendre">↓</button>
          <button
            type="button"
            onClick={() => setReplacing((value) => !value)}
            className="text-muted-foreground hover:text-foreground"
            title="Remplacer"
            aria-label={`Remplacer l’image ${idx + 1}`}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button type="button" onClick={onRemove} className="text-destructive hover:text-destructive/70" title="Supprimer" aria-label={`Supprimer l’image ${idx + 1}`}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {replacing && (
        <ImageUploader
          value=""
          onChange={(replacement) => {
            if (!replacement) return;
            onReplace(replacement);
            setReplacing(false);
          }}
          label="Remplacer cette image"
          previewHeight={0}
          maxSizeMb={10}
        />
      )}
    </div>
  );
}

/* ── Single banner slot editor ──────────────────────────────────────────── */
function BannerSlotEditor({
  label,
  settingKey,
  defaultImages,
}: {
  label: string;
  settingKey: "banner1Images" | "accountBannerImages";
  defaultImages: readonly string[];
}) {
  const { toast } = useToast();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  const [urls, setUrls]   = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setUrls(parseBannerImages(settings[settingKey], defaultImages));
    setDirty(false);
  }, [settings, settingKey, defaultImages]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/settings", {
        key: settingKey,
        value: serializeBannerImages(urls),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setDirty(false);
      toast({ title: `✅ ${label} sauvegardée` });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  function addImage(url: string) {
    if (!url) return;
    setUrls(prev => [...prev, url]);
    setDirty(true);
  }
  function replaceImage(idx: number, url: string) {
    setUrls((prev) => prev.map((image, index) => index === idx ? url : image));
    setDirty(true);
  }
  function remove(idx: number)    { setUrls(prev => prev.filter((_, i) => i !== idx)); setDirty(true); }
  function moveUp(idx: number)    { if (idx === 0) return; setUrls(prev => { const a = [...prev]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a; }); setDirty(true); }
  function moveDown(idx: number)  { setUrls(prev => { if (idx >= prev.length - 1) return prev; const a = [...prev]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a; }); setDirty(true); }

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              {label}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {urls.length} image{urls.length !== 1 ? "s" : ""} — défilement automatique
            </p>
          </div>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending} className="gap-1">
            {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Sauvegarder
          </Button>
        </div>

        {/* Images in this banner */}
        {urls.length === 0 ? (
          <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            Aucune image — cette bannière reste masquée jusqu’à l’ajout d’une image.
          </div>
        ) : (
          <div className="space-y-3">
            {urls.map((url, idx) => (
              <ThumbCard
                key={idx}
                url={url}
                idx={idx}
                total={urls.length}
                onMoveUp={() => moveUp(idx)}
                onMoveDown={() => moveDown(idx)}
                onReplace={(replacement) => replaceImage(idx, replacement)}
                onRemove={() => remove(idx)}
              />
            ))}
          </div>
        )}

        {/* Upload from gallery */}
        <div className="rounded-xl border border-dashed p-4 bg-muted/10">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Ajouter une image depuis votre galerie :</p>
          <ImageUploader
            value=""
            onChange={(url) => { if (url) addImage(url); }}
            label=""
            previewHeight={0}
            maxSizeMb={10}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Homepage popular-products selector ────────────────────────────────── */
function SpecialProductsConfig() {
  const { toast } = useToast();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const { data: products }  = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const paidProducts = (products || []).filter(p => !p.isFree);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!settings) return;
    try {
      const parsed = JSON.parse(settings.specialProductIds || "[]");
      setSelectedIds(Array.isArray(parsed) ? parsed.map(Number) : []);
    } catch { setSelectedIds([]); }
    setDirty(false);
  }, [settings]);

  function toggle(id: number) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) {
        toast({ title: "Maximum 4 produits", description: "Désélectionnez un produit avant d'en ajouter un autre.", variant: "destructive" });
        return prev;
      }
      return [...prev, id];
    });
    setDirty(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/settings", { key: "specialProductIds", value: JSON.stringify(selectedIds) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setDirty(false);
      toast({ title: "✅ Produits spéciaux sauvegardés" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Produits populaires (carrousel de l’accueil)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choisissez jusqu’à 4 produits; leur ordre de sélection définit l’ordre du carrousel.
              ({selectedIds.length}/4 sélectionné{selectedIds.length > 1 ? "s" : ""})
            </p>
          </div>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending} className="gap-1">
            {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Sauvegarder
          </Button>
        </div>

        {paidProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun produit payant disponible.</p>
        ) : (
          <div className="space-y-2">
            {paidProducts.map(p => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors"
                  style={{
                    background: isSelected ? "hsl(var(--primary)/0.08)" : "transparent",
                    borderColor: isSelected ? "hsl(var(--primary)/0.5)" : "hsl(var(--border))",
                  }}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover shrink-0 border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Prix : {Number(p.price).toLocaleString()} XOF · Revenu/j : {Number(p.dailyEarnings).toLocaleString()} XOF
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Main export ────────────────────────────────────────────────────────── */
export default function AdminBannerConfig() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Bannières & Produits populaires</h2>
        <p className="text-sm text-muted-foreground">
          Gérez séparément les images de la page d’accueil et de la page « Moi », puis choisissez les produits populaires.
        </p>
      </div>
      <BannerSlotEditor
        label="Bannière de la page d’accueil"
        settingKey="banner1Images"
        defaultImages={HOME_BANNER_DEFAULT_IMAGES}
      />
      <BannerSlotEditor
        label="Bannière de la page « Moi »"
        settingKey="accountBannerImages"
        defaultImages={ACCOUNT_BANNER_DEFAULT_IMAGES}
      />
      <SpecialProductsConfig />
    </div>
  );
}
