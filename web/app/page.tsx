import Link from "next/link";
import DisclaimerFooter from "@/components/DisclaimerFooter";

export default function Home() {
  return (
    <>
      <main className="mx-auto max-w-5xl px-6 py-24">
        <h1 className="text-4xl font-semibold">Read the market. <span className="text-slate-400">Not the noise.</span></h1>
        <p className="mt-4 max-w-xl text-slate-400">Global markets, AI sentiment and finance education. The prototype design is being ported here.</p>
        <Link href="/markets" className="mt-8 inline-block rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium hover:bg-blue-500">Explore markets</Link>
      </main>
      <DisclaimerFooter />
    </>
  );
}
