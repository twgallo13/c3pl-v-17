import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "@phosphor-icons/react";
import { BUILD_LOG_V17 } from "@/lib/build-log";

export function TransitionReadinessChecklist() {
  const { readinessChecklist } = BUILD_LOG_V17;
  
  const items = [
    { key: "noTypeScriptErrors", label: "No TypeScript errors in console", status: readinessChecklist.noTypeScriptErrors },
    { key: "buildLogComplete", label: "Build log includes all changes tied to V17.0.0", status: readinessChecklist.buildLogComplete },
    { key: "versionTagVisible", label: "Version tag visible in-app for audit tracking", status: readinessChecklist.versionTagVisible },
    { key: "githubMigrationReady", label: "Structure ready for GitHub migration", status: readinessChecklist.githubMigrationReady },
    { key: "allFeaturesImplemented", label: "All V17.0.0 features implemented", status: readinessChecklist.allFeaturesImplemented }
  ];

  const allReady = items.every(item => item.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Transition Readiness Checklist
          {allReady && <Badge variant="default" className="bg-green-600">Ready</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <CheckCircle 
                size={20} 
                className={item.status ? "text-green-600" : "text-muted-foreground"} 
                weight={item.status ? "fill" : "regular"}
              />
              <span className={`text-sm ${item.status ? "text-foreground" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
        
        {allReady && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              ✅ C3PL V17.0.0 is ready for GitHub migration!
            </p>
            <p className="text-xs text-green-600 mt-1">
              Project can now transition from Sparky → GitHub with Copilot AI
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}