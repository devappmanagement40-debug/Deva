import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isPaymentQrDataUrl, readPaymentQrImage } from "@/lib/payment-qr-image";

interface PaymentQrUploaderProps {
  value: string | null | undefined;
  onChange(value: string): void;
  testId?: string;
}

export default function PaymentQrUploader({
  value,
  onChange,
  testId = "input-ci-payment-qr",
}: PaymentQrUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const preview = isPaymentQrDataUrl(value) ? value : "";

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setLoading(true);
    try {
      onChange(await readPaymentQrImage(file));
    } catch (error) {
      toast({
        title: "QR non chargé",
        description: error instanceof Error ? error.message : "Choisissez une image valide.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Code QR Wave <span className="font-normal text-muted-foreground">(optionnel)</span>
      </p>
      {preview ? (
        <div className="flex items-center gap-3 rounded-lg border border-border p-2">
          <img
            src={preview}
            alt="Aperçu du QR Wave"
            className="h-24 w-24 rounded border border-border bg-white p-1 object-contain"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => onChange("")}
          >
            <X className="mr-1 h-4 w-4" />
            Retirer le QR
          </Button>
        </div>
      ) : value ? (
        <p className="text-xs text-destructive" role="status">
          Le QR enregistré n’est pas valide. Téléversez une nouvelle image.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Aucun QR ajouté.</p>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        data-testid={testId}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={() => fileRef.current?.click()}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="mr-2 h-4 w-4" />
        )}
        {loading ? "Lecture de l’image…" : preview ? "Remplacer le QR" : "Téléverser le QR"}
      </Button>
      <p className="text-xs text-muted-foreground">Formats PNG, JPG ou WebP, 1 Mo maximum.</p>
    </div>
  );
}
