import { VIS } from "@/lib/vis";

/** Teaching illustration. The SVG strings are our own constants (lib/vis.ts), never user input. */
export default function Vis({ k, className = "tv" }: { k: string; className?: string }) {
  const draw = VIS[k];
  return <div className={className} dangerouslySetInnerHTML={{ __html: draw ? draw() : "" }} />;
}
