# C3PL V17.2.0 - Product Requirements Document

## Version History
- **V17.0.0**: Initial release with QA login, role switcher, console output toggle, basic debugger
- **V17.0.1**: Enhanced with Network Inspector, Schema Validator, and Error Replayer
- **V17.1.0**: Invoice system with Firestore schema, lifecycle management, export functionality
- **V17.1.1**: WMS implementation with receiving, wave control, picking, and packout workflows
- **V17.1.2**: RMA end-to-end with disposition handlers, audit links, and finance integration
- **V17.1.3**: Finance hardening with GL posting, export parity, advanced math, and dashboard
- **V17.1.4**: Payments Console with bank reconciliation, AR aging enhancements, and dunning automation
- **V17.2.0**: Quote Generator wizard and Benchmarks Import with pricing engine and competitor comparison

## Core Purpose & Success

**Mission Statement**: C3PL is a comprehensive financial operations and warehouse management system that provides automated quote generation, benchmark data management, payment processing, bank reconciliation, and pricing intelligence with enterprise-grade audit trails.

**Success Indicators**: 
- Benchmarks import validated and committed with rollback capability
- Quotes generated with correct line itemization and totals calculation
- Export parity passing for all quote formats (PDF/CSV/XLSX) with stored digests
- Competitor comparison computed and displayed with delta percentages
- Lane resolution working with zip3 → state → country specificity
- Discount precedence enforced (flat → percent) with correct scoping
- All quote and benchmark operations logged with V17.2.0 version tracking

**Experience Qualities**: Intelligent, Precise, Comparative

## Project Classification & Approach

**Complexity Level**: Complex Enterprise Application with quote generation, benchmarks management, pricing intelligence, and competitive analysis
**Primary User Activity**: Creating, Analyzing, and Comparing - users create quotes with benchmarks, analyze pricing scenarios, and compare against competitors

## Essential Features

### V17.2.0 Quote Generator Features

#### 1. 5-Step Quote Generation Wizard
- **Functionality**: Mobile-first wizard progressing through Basics → VAS → Pricing → Comparison → Summary
- **Purpose**: Guided quote creation with progressive disclosure and mobile optimization
- **Success Criteria**: All steps navigable, sticky totals footer, mobile-responsive design, vendor read-only mode

#### 2. Benchmarks Import System (Admin Only)
- **Functionality**: CSV import with validation, dry-run, commit, and rollback capabilities
- **Purpose**: Maintain accurate benchmark data with version control and audit trail
- **Success Criteria**: Strict CSV validation, cross-file integrity checks, import/rollback tracking, admin-only access

#### 3. Pricing Engine with Lane Resolution
- **Functionality**: Specificity-based rate selection (zip3 → state → country) with discount precedence
- **Purpose**: Accurate pricing based on geographic specificity and business rules
- **Success Criteria**: Lane matching works correctly, discount order enforced (flat → percent), taxes applied after discounts

#### 4. Competitor Comparison Analysis
- **Functionality**: Side-by-side comparison with delta calculation and percentage differences
- **Purpose**: Competitive positioning with visual indicators for win/loss scenarios  
- **Success Criteria**: Delta amounts calculated correctly, percentage differences displayed, visual win/loss indicators

#### 5. Export System with Parity Validation
- **Functionality**: PDF/CSV/XLSX exports with SHA-256 digests and parity checking
- **Purpose**: Professional quote documentation with data integrity guarantees
- **Success Criteria**: All export formats match UI totals, digests stored, parity validation passing

#### 6. Debugger Enhancement Tools
- **Functionality**: Quote Simulator and Import Validator in debugger panel
- **Purpose**: Development and testing tools for pricing logic validation
- **Success Criteria**: JSON input/output testing, CSV validation preview, error reporting

### V17.2.0 RBAC & Access Control
- **Sales/Account Manager**: Create and export quotes, read benchmarks
- **Admin**: Full benchmark import/export/rollback, all quote functions
- **Vendor**: Read-only access to quotes sent to them, no editing capabilities
- **Finance/CS/Ops**: Read access to quotes and benchmarks, no creation rights

## Design Direction

### Visual Tone & Identity
**Emotional Response**: Intelligent precision, competitive confidence, analytical clarity
**Design Personality**: Strategic intelligence with enterprise-grade data presentation
**Visual Metaphors**: Pricing wizard, competitive dashboard, benchmark laboratory
**Simplicity Spectrum**: Progressive disclosure with mobile-first responsive design

### Color Strategy
**Color Scheme Type**: Complementary with professional data visualization
**Primary Color**: Deep blue (oklch(0.35 0.15 250)) for primary actions and quote totals
**Secondary Colors**: Muted blue-gray for supporting quote elements  
**Accent Color**: Warm orange (oklch(0.62 0.25 40)) for competitive deltas and highlights
**Status Colors**:
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