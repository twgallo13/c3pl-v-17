import { Badge } from "@/components/ui/badge";
import { getActiveVersion } from "@/lib/version";

export function VersionDisplay() {
  return (
    <Badge 
      variant="outline" 
      className="font-mono text-sm font-semibold bg-primary/10 text-primary border-primary/20"
    >
      {getActiveVersion()}
    </Badge>
  );
}