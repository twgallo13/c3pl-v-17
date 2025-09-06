import { Badge } from "@/components/ui/badge";
import { VERSION } from "@/lib/types";

export function VersionDisplay() {
  return (
    <Badge 
      variant="outline" 
      className="font-mono text-sm font-semibold bg-primary/10 text-primary border-primary/20"
    >
      {VERSION}
    </Badge>
  );
}