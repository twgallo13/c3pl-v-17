#!/bin/bash
# V17.1.2-p4c — build verification script
echo "Testing TypeScript compilation..."
npx tsc --noEmit
echo "Build verification complete."