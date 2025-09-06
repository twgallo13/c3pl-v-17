# C3PL V17.1.2-p4 - Product Requirements Document

## Version History
- **V17.0.0**: Initial release with QA login, role switcher, console output toggle, basic debugger
- **V17.0.1**: Enhanced with Network Inspector, Schema Validator, and Error Replayer
- **V17.1.0**: Invoice system with Firestore schema, lifecycle management, export functionality
- **V17.1.1**: WMS implementation with receiving, wave control, picking, and packout workflows
- **V17.1.2**: RMA end-to-end with disposition handlers, audit links, and finance integration
- **V17.1.3**: Finance hardening with GL posting, export parity, advanced math, and dashboard
- **V17.1.4**: Payments Console with bank reconciliation, AR aging enhancements, and dunning automation
- **V17.2.0**: Quote Generator wizard and Benchmarks Import with pricing engine and competitor comparison
- **V17.1.2-p4**: Theme & Navigation Lock - Registry-driven routing, Debugger removed from shell, Dashboards Home landing

## Core Purpose & Success

**Mission Statement**: C3PL is a comprehensive financial operations and warehouse management system that provides themed navigation, role-based access control, and dashboard-driven workflows with enterprise-grade audit trails.

**Success Indicators**: 
- Themed app shell with sidebar navigation driven by explicit route registry
- Debugger completely removed from main shell and hidden behind admin route (disabled in release)
- Dashboards Home as default landing page with workflow tiles
- RBAC-filtered navigation showing only accessible routes per role
- Zero TypeScript errors with React Router implementation
- Version V17.1.2-p4 displayed prominently in header

**Experience Qualities**: Organized, Intuitive, Professional

## Project Classification & Approach

**Complexity Level**: Complex Enterprise Application with themed navigation, role-based routing, and dashboard-driven workflows

**Primary User Activity**: Navigate between workflows efficiently with clear visual hierarchy and role-appropriate access

## Essential Features

### V17.1.2-p4 Theme & Navigation Features

#### 1. Themed App Shell with Sidebar Navigation
- **Functionality**: Fixed sidebar with role-filtered navigation, header with version badge and role switcher
- **Purpose**: Consistent navigation experience with clear visual hierarchy
- **Success Criteria**: Sidebar shows only accessible routes per role, active route highlighting, mobile-responsive design

#### 2. Registry-Driven Route System  
- **Functionality**: Explicit route registry with workflow grouping and role-based access control
- **Purpose**: Maintainable routing system with clear permissions and organization
- **Success Criteria**: Routes load from registry, RBAC filtering works, lazy loading functional

#### 3. Dashboards Home Landing Page
- **Functionality**: Workflow tiles linking to major functional areas (Finance, RMA, Sales, Admin)
- **Purpose**: Clear entry point showing available workflows with descriptive cards
- **Success Criteria**: All workflow tiles render, navigation links work, role-appropriate content shown

#### 4. Debugger Removed from Shell (Release Mode)
- **Functionality**: Debugger only accessible via hidden admin route when debug flags enabled
- **Purpose**: Clean production interface without development tools cluttering the UI
- **Success Criteria**: No debugger UI in release mode, hidden route works when debug enabled

#### 5. Version Display and Tracking
- **Functionality**: V17.1.2-p4 badge prominently displayed in header
- **Purpose**: Clear version identification for audit and testing purposes
- **Success Criteria**: Version badge visible, matches build version, consistent across views

### V17.1.2-p4 RBAC & Access Control
- **Finance/Admin**: Full access to finance workflows and admin tools
- **Operations**: Access to RMA adjustments and operational dashboards  
- **Account Manager**: Access to sales tools and quote generation
- **Vendor**: Read-only access to relevant finance and quote exports

## Design Direction

### Visual Tone & Identity
**Emotional Response**: Professional organization, workflow clarity, role-appropriate access
**Design Personality**: Clean enterprise interface with clear navigation hierarchy
**Visual Metaphors**: Dashboard tiles, workflow organization, role-based access gates  
**Simplicity Spectrum**: Clean sidebar navigation with contextual content areas

### Color Strategy
**Color Scheme Type**: Professional monochromatic with accent highlights
**Primary Color**: Deep blue (oklch(0.35 0.15 250)) for navigation and primary actions
**Secondary Colors**: Blue-gray tones for supporting navigation elements  
**Accent Color**: Warm orange (oklch(0.62 0.25 40)) for active states and highlights
**Navigation Colors**:
- Green (profitable quotes, validation pass)
- Red (competitive disadvantage, validation errors) 
- Yellow (warnings, margin alerts)
- Gray (neutral baseline, disabled states)

### Typography System
**Font Pairing Strategy**: Inter for quote UI, JetBrains Mono for pricing data and JSON
**Typographic Hierarchy**: Clear quote totals hierarchy, competitive comparison emphasis
**Mobile Optimization**: Responsive text sizing for quote wizard on mobile devices
**Data Display**: Monospace for pricing precision and alignment consistency

### UI Components & Quote-Specific Layout
**Wizard Components**:
- Step progress indicator with clear visual progression
- Card-based step content with consistent spacing
- Sticky totals footer for persistent quote visibility
- Mobile-responsive form layouts with touch-friendly controls

**Quote Display Components**:
- Itemized line tables with category badges
- Totals breakdown with discount flow visualization  
- Competitor comparison block with delta highlighting
- Export action buttons with digest status indicators

**Benchmark Components**:
- File upload interface with validation status icons
- CSV preview tables with error highlighting
- Import progress indicators with rollback capability
- Audit log display with timestamp and actor tracking

### Animations
**Quote Wizard Flow**: Smooth step transitions, sticky footer animations, loading states for quote generation
**Competitive Comparison**: Subtle animations for delta calculations and win/loss indicators
**Import Validation**: Progress indicators, success/failure state transitions

## Technical Implementation

### V17.2.0 Pricing Engine Architecture
- Lane resolution with geographic specificity (zip3 → state → country)
- Discount precedence enforcement (flat amounts before percentages)
- Tax calculation after discounts with configurable rates
- Rounding mode selection (HALF_UP, HALF_EVEN) with precision control

### Benchmarks Data Management
- CSV schema validation with strict header requirements
- Cross-file referential integrity checking
- Version-controlled import with rollback capability
- Checksum generation for data integrity verification

### Quote Export & Parity System
- Multi-format export generation (PDF/CSV/XLSX)
- SHA-256 digest calculation and storage
- UI vs export total comparison with discrepancy detection
- Export history tracking with digest verification

### State Management & Persistence
- Quote wizard state preservation across browser sessions
- Benchmark version tracking with import history
- Export digest storage for audit trail maintenance
- Mobile-optimized state management for responsive design

### Logging & Observability
- V17.2.0 versioned logging for all quote and benchmark operations
- Quote generation events with line count and total tracking
- Benchmark import events with validation results and checksums
- Export parity events with pass/fail status and format details

### Build & Quality Assurance
- Zero TypeScript errors with comprehensive type coverage
- Quote calculation unit tests with edge case validation
- Benchmark import integration tests with CSV error scenarios
- Export parity tests ensuring UI/export consistency
- Mobile responsiveness testing across device sizes
- All changes tracked and tied to version V17.2.0

## Transition Readiness Checklist

### Development Complete
- [ ] No TypeScript errors in console
- [ ] Import validates and commits benchmarks, rollback restores previous state  
- [ ] Quotes generate with correct lines/totals and comparison block
- [ ] Export parity PASS with digests recorded for PDF/CSV/XLSX
- [ ] Sticky totals footer functional on mobile devices
- [ ] Vendor read-only mode prevents quote editing
- [ ] Build log includes all V17.2.0 changes

### Quality Validation
- [ ] Lane resolution precedence working (zip3 → state → country)
- [ ] Discount order enforced (flat → percent) with correct scoping
- [ ] Competitor comparison calculates deltas and percentages correctly
- [ ] CSV validation rejects malformed data with specific error messages
- [ ] Quote wizard mobile-responsive across all steps
- [ ] Debugger tools (Quote Sim, Import Val) functional with test data

### Production Ready  
- [ ] All quote operations logged with V17.2.0 version stamps
- [ ] RBAC enforced (Sales create, Admin import, Vendor readonly)
- [ ] Export digests stored and verified for data integrity
- [ ] Benchmark rollback tested with sample import data
- [ ] Performance acceptable on mobile devices with large quotes
- [ ] Ready for GitHub migration with complete feature documentation
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