import { useRef, useState } from "react";
import "./_group.css";
import ReferenceSource from "./ReferenceSource";

export function Reference() {
  const [payerPhoneDigits, setPayerPhoneDigits] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [proofName, setProofName] = useState("");
  const [previewAcknowledgement, setPreviewAcknowledgement] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={proofInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          setProofName(event.currentTarget.files?.[0]?.name ?? "");
          setPreviewAcknowledgement(false);
        }}
      />
      <ReferenceSource
        amountXof={50000}
        currency="XOF"
        operatorName="Wave"
        operatorPhone=""
        operatorOwnerName=""
        operatorLogoUrl={null}
        paymentUrl={null}
        paymentQrDataUrl={null}
        payerPhoneDigits={payerPhoneDigits}
        onPayerPhoneDigitsChange={(value) => {
          setPayerPhoneDigits(value);
          setPreviewAcknowledgement(false);
        }}
        transactionId={transactionId}
        onTransactionIdChange={(value) => {
          setTransactionId(value);
          setPreviewAcknowledgement(false);
        }}
        proofName={proofName}
        onPickProof={() => proofInputRef.current?.click()}
        isSubmitting={false}
        onBack={() => undefined}
        onSubmitForReview={() => setPreviewAcknowledgement(true)}
        onToggleLanguage={() => undefined}
        previewAcknowledgement={previewAcknowledgement}
        language="fr"
      />
    </>
  );
}
