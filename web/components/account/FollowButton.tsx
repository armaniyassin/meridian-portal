import ToggleSave from "@/components/account/ToggleSave";

export default function FollowButton({ symbol, label }: { symbol: string; label: string }) {
  return <ToggleSave table="watchlist" keyCol="symbol" keyVal={symbol} off={`+ Follow ${label}`} on={`✓ Following ${label}`} reason={`to follow ${label}`}
    limitMsg="Free accounts follow up to 5 tickers. Pro, coming soon, removes the limit." doneOn={`Following ${label}.`} doneOff={`Unfollowed ${label}.`} />;
}
