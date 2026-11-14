"use client";
import { toast } from "@/components/Toaster";

export default function CopyLink() {
  return <button className="b" type="button" onClick={() => { navigator.clipboard.writeText(location.href).then(() => toast("Link copied"), () => toast("Copy the link from the address bar.")); }}>Copy link</button>;
}
