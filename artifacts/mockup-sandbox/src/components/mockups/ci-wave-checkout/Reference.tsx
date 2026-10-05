import { useState } from "react";
import "./_group.css";
import ReferenceSource from "./ReferenceSource";

export function Reference() {
  const [payerPhoneDigits, setPayerPhoneDigits] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [previewAcknowledgement, setPreviewAcknowledgement] = useState(false);

  return (
      <ReferenceSource
        amountXof={50000}
        currency="XOF"
        operatorName="Wave"
        operatorLogoUrl={null}
        paymentUrl={null}
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
        isSubmitting={false}
        onBack={() => undefined}
        onSubmitForReview={() => setPreviewAcknowledgement(true)}
        onToggleLanguage={() => undefined}
        previewAcknowledgement={previewAcknowledgement}
        language="fr"
      />
  );
}
