#!/bin/bash
# V17.1.2-p5a verification script

echo "🔍 Verifying V17.1.2-p5a implementation..."

# Check if all key files exist
echo "📁 Checking file structure..."
test -f "src/components/admin/sitemap.tsx" && echo "✅ Admin sitemap exists" || echo "❌ Admin sitemap missing"
test -f "src/routes/registry.tsx" && echo "✅ Route registry exists" || echo "❌ Route registry missing"
test -f "src/components/layout/AppShell-simple.tsx" && echo "✅ AppShell exists" || echo "❌ AppShell missing"
test -f "src/components/dashboards/home.tsx" && echo "✅ Dashboards home exists" || echo "❌ Dashboards home missing"

# Check version consistency
echo "🔖 Checking version tags..."
grep -q "V17.1.2-p5a" "src/App.tsx" && echo "✅ App.tsx version updated" || echo "❌ App.tsx version not updated"
grep -q "V17.1.2-p5a" "index.html" && echo "✅ HTML title updated" || echo "❌ HTML title not updated"

# Check route registry exports
echo "📋 Checking route registry..."
grep -q "AdminSitemap" "src/routes/registry.tsx" && echo "✅ Sitemap route registered" || echo "❌ Sitemap route missing"
grep -q "/admin/sitemap" "src/routes/registry.tsx" && echo "✅ Sitemap path defined" || echo "❌ Sitemap path missing"

# Check AppShell footer
echo "🦶 Checking footer crumb..."
grep -q "FooterCrumb" "src/components/layout/AppShell-simple.tsx" && echo "✅ Footer crumb implemented" || echo "❌ Footer crumb missing"

echo "🎯 V17.1.2-p5a verification complete!"