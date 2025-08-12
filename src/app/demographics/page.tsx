import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DemographicsForm from "./DemographicsForm";

export const dynamic = "force-dynamic";

export default async function DemographicsPage() {
  const store = await cookies();
  const pid = store.get("te_pid")?.value;
  if (!pid) redirect("/start");

  // For now, a single global median and currency
  const median = 50000; // USD
  const currency = "USD";

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center">
        Optional demographics
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        All questions are optional. Your responses improve our peer comparison analysis.
      </p>
      <div className="mt-8">
        <DemographicsForm median={median} currency={currency} />
      </div>
    </div>
  );
}
