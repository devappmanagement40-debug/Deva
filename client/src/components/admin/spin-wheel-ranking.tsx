import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pin, Search, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RankingEntry {
  id: number;
  phone: string;
  amount: string;
  description: string;
  createdAt: string;
  isVisible: boolean;
}

interface RankingData {
  entries: RankingEntry[];
  pinnedTransactionIds: number[];
  hiddenTransactionIds: number[];
}

type RankingUpdate = Pick<RankingData, "pinnedTransactionIds" | "hiddenTransactionIds">;

export default function AdminSpinWheelRanking() {
  const { toast } = useToast();
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const requestUrl = phoneSearch
    ? `/api/admin/spin-wheel/ranking?phone=${encodeURIComponent(phoneSearch)}`
    : "/api/admin/spin-wheel/ranking";

  const { data, isLoading, error } = useQuery<RankingData>({
    queryKey: ["/api/admin/spin-wheel/ranking", phoneSearch],
    queryFn: async () => {
      const response = await apiRequest("GET", requestUrl);
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (update: RankingUpdate) => {
      const response = await apiRequest("PUT", "/api/admin/spin-wheel/ranking", update);
      return response.json() as Promise<RankingData>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/spin-wheel/ranking"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spin-wheel/recent"] });
      toast({ title: "Classement mis à jour" });
    },
    onError: (mutationError: Error) => {
      toast({ title: "Erreur", description: mutationError.message, variant: "destructive" });
    },
  });

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPhoneSearch(phoneInput.trim());
  };

  const updateVisibility = (entryId: number) => {
    if (!data) return;
    const isHidden = data.hiddenTransactionIds.includes(entryId);
    updateMutation.mutate({
      pinnedTransactionIds: data.pinnedTransactionIds,
      hiddenTransactionIds: isHidden
        ? data.hiddenTransactionIds.filter((id) => id !== entryId)
        : [...data.hiddenTransactionIds, entryId],
    });
  };

  const togglePin = (entryId: number) => {
    if (!data) return;
    const isPinned = data.pinnedTransactionIds.includes(entryId);
    updateMutation.mutate({
      pinnedTransactionIds: isPinned
        ? data.pinnedTransactionIds.filter((id) => id !== entryId)
        : [entryId, ...data.pinnedTransactionIds].slice(0, 30),
      hiddenTransactionIds: data.hiddenTransactionIds,
    });
  };

  const movePin = (entryId: number, direction: -1 | 1) => {
    if (!data) return;
    const currentIndex = data.pinnedTransactionIds.indexOf(entryId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= data.pinnedTransactionIds.length) return;

    const pinnedTransactionIds = [...data.pinnedTransactionIds];
    [pinnedTransactionIds[currentIndex], pinnedTransactionIds[nextIndex]] =
      [pinnedTransactionIds[nextIndex], pinnedTransactionIds[currentIndex]];
    updateMutation.mutate({
      pinnedTransactionIds,
      hiddenTransactionIds: data.hiddenTransactionIds,
    });
  };

  const pinnedIds = data?.pinnedTransactionIds ?? [];
  const hiddenIds = data?.hiddenTransactionIds ?? [];
  const pinnedEntries = pinnedIds
    .map((id) => data?.entries.find((entry) => entry.id === id))
    .filter((entry): entry is RankingEntry => Boolean(entry));
  const pinnedIdSet = new Set(pinnedIds);
  const availableEntries = (data?.entries ?? []).filter((entry) => !pinnedIdSet.has(entry.id));

  const renderEntry = (entry: RankingEntry, pinnedIndex = -1) => {
    const isPinned = pinnedIndex >= 0;
    const isVisible = !hiddenIds.includes(entry.id);

    return (
      <div
        key={entry.id}
        className="flex flex-col gap-3 rounded-xl border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{entry.phone}</span>
            <Badge variant="outline" className="gap-1">
              <Trophy className="h-3 w-3" /> Gain réel
            </Badge>
            {isPinned && <Badge>Épinglé #{pinnedIndex + 1}</Badge>}
            {!isVisible && <Badge variant="secondary">Masqué</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {Number.parseFloat(entry.amount).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} XOF
            {" · "}
            {new Date(entry.createdAt).toLocaleString("fr-FR")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {isPinned && (
            <>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Monter dans le classement"
                title="Monter"
                disabled={updateMutation.isPending || pinnedIndex === 0}
                onClick={() => movePin(entry.id, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Descendre dans le classement"
                title="Descendre"
                disabled={updateMutation.isPending || pinnedIndex === pinnedIds.length - 1}
                onClick={() => movePin(entry.id, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            type="button"
            size="sm"
            variant={isPinned ? "secondary" : "outline"}
            disabled={updateMutation.isPending || (!isPinned && pinnedIds.length >= 30)}
            onClick={() => togglePin(entry.id)}
          >
            <Pin className="mr-1.5 h-4 w-4" />
            {isPinned ? "Désépingler" : "Épingler en tête"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={updateMutation.isPending}
            onClick={() => updateVisibility(entry.id)}
          >
            {isVisible ? <EyeOff className="mr-1.5 h-4 w-4" /> : <Eye className="mr-1.5 h-4 w-4" />}
            {isVisible ? "Masquer" : "Afficher"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Classement des gains réels</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Recherche un numéro ayant déjà gagné à la roue pour l’épingler en tête. Les montants proviennent
          des transactions et ne sont pas modifiables. Les numéros restent masqués pour les utilisateurs.
        </p>

        <form onSubmit={submitSearch} className="flex gap-2">
          <Input
            type="tel"
            value={phoneInput}
            onChange={(event) => setPhoneInput(event.target.value)}
            placeholder="Rechercher un numéro (au moins 4 chiffres)"
            aria-label="Rechercher un numéro ayant gagné à la roue"
          />
          <Button type="submit" variant="outline" aria-label="Rechercher">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {updateMutation.isPending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" /> Mise à jour du classement…
          </p>
        )}
        {error instanceof Error && (
          <p className="text-sm text-destructive" role="alert">{error.message}</p>
        )}
        {isLoading && (
          <p className="text-sm text-muted-foreground" role="status">Chargement des gains enregistrés…</p>
        )}

        {!isLoading && data && (
          <div className="space-y-5">
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">Épinglés en tête</h4>
                <span className="text-xs text-muted-foreground">{pinnedEntries.length} / 30</span>
              </div>
              {pinnedEntries.length > 0 ? (
                <div className="space-y-2">
                  {pinnedEntries.map((entry, index) => renderEntry(entry, index))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  Aucun gain n’est épinglé. Les autres gains seront classés par montant.
                </p>
              )}
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold">
                {phoneSearch ? "Résultats de la recherche" : "Gains récents"}
              </h4>
              {availableEntries.length > 0 ? (
                <div className="space-y-2">
                  {availableEntries.map((entry) => renderEntry(entry))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  {phoneSearch
                    ? "Aucun gain réel enregistré pour ce numéro."
                    : "Aucun autre gain récent n’est enregistré."}
                </p>
              )}
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  );
}