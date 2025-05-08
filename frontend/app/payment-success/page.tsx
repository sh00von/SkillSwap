// app/payment-success/page.tsx
import React, { Suspense } from "react";
import PaymentSuccessClientPage from "./ClientPage"; // this is now a client component

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessClientPage />
    </Suspense>
  );
}
