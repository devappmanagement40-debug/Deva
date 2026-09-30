import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#050923]">
              <img src="/diamant-mark.svg" alt="" aria-hidden="true" className="h-9 w-9 object-contain" />
            </div>
            {t.aboutTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>{t.aboutDesc1}</p>
          <p>{t.aboutDesc2}</p>
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-foreground">{t.aboutSpecialties}</h4>
            <ul className="space-y-1">
              <li>{t.aboutSpec1}</li>
              <li>{t.aboutSpec2}</li>
              <li>{t.aboutSpec3}</li>
              <li>{t.aboutSpec4}</li>
            </ul>
          </div>
          <p className="text-xs">{t.aboutVersion}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
