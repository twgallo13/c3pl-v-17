// V17.1.2-p4g — Quick test to verify key components load


// Check if routes are importable
try {
  const fs = require('fs');
  const files = [
  
  // Check if key files exist
  const files = [
    'src/routes/registry.tsx',
    'src/components/dashboards/home.tsx',
      console.log(`❌ ${file} missing`);
  });
  // Check registry content
  const registryConten
  if (registryContent.in
  } 
  
  if (registryContent.inc
  } else {
  }
  // Check App.tsx
  const appC
  if (appContent.includes('V17.1.2-p4g'
  } e
  }
  
  } else {
  }
  console.log('\nTest completed!');
} 
}















  if (appContent.includes('V17.1.2-p4g')) {
    console.log('✅ Version V17.1.2-p4g found in App.tsx');
  } else {
    console.log('❌ Version V17.1.2-p4g missing from App.tsx');
  }
  
  if (appContent.includes('Navigate to="/dashboards"')) {
    console.log('✅ Root redirects to /dashboards');
  } else {
    console.log('❌ Root does not redirect to /dashboards');
  }
  
  console.log('\nTest completed!');
  
} catch (error) {
  console.error('Test failed:', error.message);
}