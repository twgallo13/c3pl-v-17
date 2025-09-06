// V17.1.2-p9a test - verify components compile
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Test our simplified components
import DashboardsHome from '@/components/dashboards/home';
import FinanceDashboard from '@/components/finance-dashboard-simple';
import RmaAdjustments from '@/components/rma-adjustments';
import PaymentsConsole from '@/components/payments-console-placeholder';
import RmaIntake from '@/components/rma-intake-placeholder';

// Test the imports work
console.log('Component imports successful:', {
  DashboardsHome,
  FinanceDashboard,
  RmaAdjustments,
  PaymentsConsole,
  RmaIntake
});

// Test basic rendering
function TestApp() {
  return (
    <BrowserRouter>
      <div>
        <h1>Component Test</h1>
        <DashboardsHome />
        <FinanceDashboard />
        <RmaAdjustments />
        <PaymentsConsole />
        <RmaIntake />
      </div>
    </BrowserRouter>
  );
}

export default TestApp;