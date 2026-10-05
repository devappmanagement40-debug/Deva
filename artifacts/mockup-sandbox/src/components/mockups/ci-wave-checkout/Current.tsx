import "./_group.css";
import CurrentSource from "./CurrentSource";

export function Current() {
  return (
    <CurrentSource
      amountXof={50000}
      currency="FCFA"
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
      language="fr"
    />
  );
}
