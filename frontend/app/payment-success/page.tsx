"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const tranId = params.get("tran_id");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4 text-green-600">
          🎉 Payment Successful!
        </h1>
        {tranId && (
          <p className="mb-4">
            Your transaction ID: <strong>{tranId}</strong>
          </p>
        )}
        <p className="mb-6 text-gray-700">
          Thank you for completing your payment. Your swap request has been received and will be processed shortly.
        </p>
        <Link
          href="/skills"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded"
        >
          Back to Skills
        </Link>
      </div>
    </div>
  );
}
