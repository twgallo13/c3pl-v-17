# C3PL V17.1.4 - Product Requirements Document

## Version History
- **V17.0.0**: Initial release with QA login, role switcher, console output toggle, basic debugger
- **V17.0.1**: Enhanced with Network Inspector, Schema Validator, and Error Replayer
- **V17.1.0**: Invoice system with Firestore schema, lifecycle management, export functionality
- **V17.1.1**: WMS implementation with receiving, wave control, picking, and packout workflows
- **V17.1.2**: RMA end-to-end with disposition handlers, audit links, and finance integration
- **V17.1.3**: Finance hardening with GL posting, export parity, advanced math, and dashboard
- **V17.1.4**: Payments Console with bank reconciliation, AR aging enhancements, and dunning automation

## Core Purpose & Success

**Mission Statement**: C3PL is a comprehensive financial operations and warehouse management system that provides real-time payment processing, bank reconciliation, AR aging analysis, and automated dunning with enterprise-grade audit trails.

**Success Indicators**: 
- Payments applied across multiple invoices with correct residual balances
- Bank reconciliation matching receipts with transaction references
- AR aging totals equal sum of open invoice balances
- Dunning export generated with correct stages and amounts
- Remittance export parity passing (UI vs PDF/CSV)
- All payment operations logged with V17.1.4 version tracking

**Experience Qualities**: Professional, Automated, Comprehensive

## Project Classification & Approach

**Complexity Level**: Complex Enterprise Application with payment processing, bank reconciliation, AR management, and automated dunning
**Primary User Activity**: Processing, Reconciling, and Managing - users process payments, reconcile bank feeds, and manage customer collections

## Essential Features

### V17.1.4 Payments Features

#### 1. Payments Console
- **Functionality**: Finance/Admin interface for comprehensive payment management
- **Purpose**: Centralized payment processing with role-based access control
- **Success Criteria**: Four functional tabs (Receipts, Unapplied, Reconciliation, Dunning), RBAC enforced, real-time status updates

#### 2. Payment Processing Service
- **Functionality**: Record, apply, and reconcile payments with GL integration
- **Purpose**: Complete payment lifecycle with automatic invoice status updates
- **Success Criteria**: Payments split across multiple invoices, GL entries balanced, status transitions accurate

#### 3. Bank Reconciliation Engine
- **Functionality**: CSV import with automatic matching by amount, date, and reference
- **Purpose**: Streamline bank reconciliation with intelligent matching algorithms
- **Success Criteria**: High-confidence matches identified, manual override capability, reconciliation status tracking

#### 4. Enhanced AR Aging Widget
- **Functionality**: Clickable aging buckets with filtered invoice navigation
- **Purpose**: Visual AR analysis with drill-down capability
- **Success Criteria**: Buckets calculate correctly, click-through functionality, progress bar visualization

#### 5. Dunning Automation
- **Functionality**: Automated dunning queue generation with configurable rules
- **Purpose**: Streamline collections process with systematic follow-up
- **Success Criteria**: Queue generated based on terms, stages calculated correctly, export functionality operational

#### 6. Remittance Advice
- **Functionality**: Generate payment advice with export parity checking
- **Purpose**: Professional payment documentation with data integrity
- **Success Criteria**: PDF/CSV exports match UI totals, digests stored, parity validation passing
- **Success Criteria**: Invoice status updates to 'paid', optional GL entries balanced, payment history tracking

#### 5. Finance Dashboard
- **Functionality**: AR Aging, Open Invoices, Recent GL Posts with filtering
- **Purpose**: Real-time visibility into financial position and activity
- **Success Criteria**: AR aging by buckets (0-30, 31-60, 61-90, >90 days), filterable GL activity

#### 6. Enhanced Invoice Detail
- **Functionality**: GL Journal links and comprehensive totals display
- **Purpose**: Complete financial artifact traceability and audit capability
- **Success Criteria**: GL journal drawer with entries, enhanced totals (Before → After Discounts → Taxes → Grand Total)

#### 7. RMA Adjustments View
- **Functionality**: Financial adjustments from RMA processing with GL links
- **Purpose**: Visibility into all RMA-generated financial artifacts
- **Success Criteria**: Artifact type, amount, GL journal ID, posted date columns

#### 8. Export Parity Debugger
- **Functionality**: Compare UI totals to export totals with digest verification
- **Purpose**: Debug and validate export consistency during development
- **Success Criteria**: Format-specific comparison, digest display, discrepancy identification

## Design Direction

### Visual Tone & Identity
**Emotional Response**: Professional confidence, systematic control, debugging clarity
**Design Personality**: Technical precision with enterprise-grade polish
**Visual Metaphors**: Dashboard, control panel, diagnostic interface
**Simplicity Spectrum**: Rich interface prioritizing functionality and information density

### Color Strategy
**Color Scheme Type**: Complementary with accent highlights
**Primary Color**: Deep blue (oklch(0.35 0.15 250)) for primary actions and focus states
**Secondary Colors**: Muted blue-gray for supporting elements
**Accent Color**: Warm orange (oklch(0.62 0.25 40)) for warnings and important highlights
**Status Colors**: 
- Green (success, valid states)
- Red (errors, failures)
- Yellow (warnings, pending states)
- Gray (neutral, disabled states)

### Typography System
**Font Pairing Strategy**: Inter for UI text, JetBrains Mono for code/data display
**Typographic Hierarchy**: Clear distinction between headers (600-700 weight), body (400 weight), and code (mono)
**Font Personality**: Clean, technical, highly legible
**Readability Focus**: Optimized for extended debugging sessions

### UI Components & Layout
**Component Usage**: 
- Cards for feature grouping and content organization
- Tabs for feature switching in debugger panel
- Tables and scrollable areas for data inspection
- Badges for status indicators and version tags
- Buttons with clear visual hierarchy (primary, secondary, outline, destructive)

**Component States**: 
- Loading states for async operations
- Error states with clear messaging
- Success confirmations for completed actions
- Disabled states for unavailable features

### Animations
**Purposeful Motion**: Subtle transitions for state changes, smooth tab switching, gentle loading indicators
**Performance Focus**: All animations under 300ms, no blocking transitions

## Technical Implementation

### TypeScript Validation
- Full type safety with proper interfaces for all data structures
- No silent type conversions or unhandled edge cases
- Comprehensive error boundaries with typed error handling

### State Management
- Persistent state using useKV hooks for cross-session data retention
- Reactive state updates for real-time debugging information
- Proper cleanup and memory management for debugging data

### Logging & Monitoring
- Structured logging with actor, module, and timestamp context
- Schema validation warnings logged with full context
- All exceptions captured with stack traces and replay data

### Build & Compliance
- Zero TypeScript errors in production build
- All changes tracked and tied to version V17.0.1
- Complete audit trail for GitHub migration readiness

## Transition Readiness Checklist

### V17.0.1 Requirements
- [x] No TypeScript errors in console
- [x] Build log includes all changes tied to V17.0.1
- [x] Version tag visible in-app for audit tracking
- [ ] Schema Validator tested against at least 3 modules (testable via UI)
- [ ] Error Replayer tested with at least 1 simulated exception (testable via UI)
- [ ] GitHub migration prep updated (depends on test completion)

### Migration Protocol
1. Complete V17.0.1 testing via built-in test controls
2. Merge with existing V17.0.0 foundation
3. Validate all features in QA environment
4. Approve for GitHub migration with Copilot AI
5. Create new repository with complete version history

## Success Metrics
- **Zero Silent Failures**: All exceptions logged with full context
- **Complete Test Coverage**: Schema validation and error replay tested across all major modules
- **Audit Compliance**: Full traceability of all changes tied to version numbers
- **Migration Readiness**: Clean TypeScript build with no errors or warnings