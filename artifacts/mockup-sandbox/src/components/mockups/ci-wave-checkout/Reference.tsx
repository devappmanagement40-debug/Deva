import "./_group.css";
import ReferenceSource from "./ReferenceSource";

export function Reference() {
  return (
    <ReferenceSource
      amountXof={50000}
      currency="XOF"
      operatorName="Wave"
      operatorPhone="07 00 00 00 00"
      operatorOwnerName="DIAMANT"
      operatorLogoUrl={null}
      paymentUrl={null}
      paymentQrDataUrl={null}
      payerPhoneDigits=""
      onPayerPhoneDigitsChange={() => undefined}
      transactionId=""
      onTransactionIdChange={() => undefined}
      proofName=""
      onPickProof={() => undefined}
      isSubmitting={false}
      onBack={() => undefined}
      onSubmitForReview={() => undefined}
      onToggleLanguage={() => undefined}
      language="fr"
    />
  );
}
