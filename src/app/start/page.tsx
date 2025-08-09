import { headers } from "next/headers";
import StartForm from "./StartForm";
import countriesData from "world-countries";

// Build countries list on the server. Uses the 'world-countries' dataset.
type WorldCountry = { cca2?: string; name?: { common?: string } };
function getCountries() {
  const countries = (countriesData as WorldCountry[])
    .map((c) => ({ code: String(c.cca2 || "").toUpperCase(), name: String(c.name?.common || "") }))
    .filter((c) => c.code && c.name)
    .sort((a, b) => a.name.localeCompare(b.name));
  return countries as { code: string; name: string }[];
}

export default async function StartPage() {
  const hdrs = await headers();
  const fromHeader = (hdrs.get("x-vercel-ip-country") || "US").toUpperCase();
  const countries = getCountries();
  const defaultCountry = countries.find((c) => c.code === fromHeader)?.code || "US";

  return (
    <div className="min-h-[calc(100dvh-0px)] py-12 px-6 md:py-16">
      <div className="mx-auto max-w-3xl text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
          Take the Challenge
        </div>
        <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight">
          Can You Spot the AI?
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground">
          Just two quick questions. Then you&apos;ll see a curated set of images and test your perception.
        </p>
      </div>

      <StartForm defaultCountry={defaultCountry} countries={countries} />
    </div>
  );
}
