// V17.2.0 — Benchmarks Import Service
import { logEvent, stamp } from '@/lib/build-log';
import { BenchmarkRate, ValueAddedOption, BenchmarksImportResult } from '@/lib/types';

const tag = stamp('V17.2.0', 'benchmarks');

export interface ImportFiles {
  benchmark_rates?: File;
  value_added_options?: File;
  category_mapping?: File;
  industry_sources?: File;
  region_mapping?: File;
}

export interface ValidationResult {
  rowErrors: Array<{
    file: string;
    row: number;
    errors: string[];
  }>;
  crossFileErrors: string[];
  warnings: string[];
  checksum: string;
}

export interface DryRunResult {
  inserts: number;
  updates: number;
  deletes: number;
  previewCount: number;
  version_id: string;
}

export class BenchmarksImportService {
  async validate(files: ImportFiles): Promise<ValidationResult> {
    const result: ValidationResult = {
      rowErrors: [],
      crossFileErrors: [],
      warnings: [],
      checksum: ''
    };

    try {
      // Validate benchmark_rates.csv
      if (files.benchmark_rates) {
        const ratesValidation = await this.validateBenchmarkRates(files.benchmark_rates);
        result.rowErrors.push(...ratesValidation.rowErrors);
        result.warnings.push(...ratesValidation.warnings);
      }

      // Validate value_added_options.csv
      if (files.value_added_options) {
        const vasValidation = await this.validateValueAddedOptions(files.value_added_options);
        result.rowErrors.push(...vasValidation.rowErrors);
        result.warnings.push(...vasValidation.warnings);
      }

      // Cross-file validation
      result.crossFileErrors = this.validateCrossFileIntegrity(files);

      // Generate checksum
      result.checksum = await this.generateChecksum(files);

      tag('benchmarks_import_validated', { 
        filesCount: Object.keys(files).length,
        errorCount: result.rowErrors.length,
        warningCount: result.warnings.length 
      });

      return result;
    } catch (error) {
      tag('benchmarks_import_validation_failed', { error: error.message });
      throw error;
    }
  }

  async dryRun(files: ImportFiles): Promise<DryRunResult> {
    try {
      // Simulate what would happen on commit
      const result: DryRunResult = {
        inserts: 0,
        updates: 0,
        deletes: 0,
        previewCount: 0,
        version_id: `v${new Date().getFullYear()}Q${Math.ceil((new Date().getMonth() + 1) / 3)}`
      };

      if (files.benchmark_rates) {
        const rates = await this.parseBenchmarkRates(files.benchmark_rates);
        result.inserts += rates.length;
        result.previewCount += rates.length;
      }

      if (files.value_added_options) {
        const vas = await this.parseValueAddedOptions(files.value_added_options);
        result.inserts += vas.length;
        result.previewCount += vas.length;
      }

      tag('benchmarks_import_dry_run', result);
      return result;
    } catch (error) {
      tag('benchmarks_import_dry_run_failed', { error: error.message });
      throw error;
    }
  }

  async commit(files: ImportFiles, mode: 'replace' | 'upsert'): Promise<{ import_id: string }> {
    try {
      const import_id = `import_${Date.now()}`;
      const validation = await this.validate(files);
      
      if (validation.rowErrors.length > 0) {
        throw new Error('Cannot commit import with validation errors');
      }

      // In a real implementation, this would write to Firestore
      // For now, we'll simulate the import process
      
      const importRecord: BenchmarksImportResult = {
        import_id,
        version_id: `v${new Date().getFullYear()}Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
        imported_at: new Date().toISOString(),
        imported_by: 'current_user',
        status: 'committed',
        files: {
          benchmark_rates: files.benchmark_rates ? (await this.parseBenchmarkRates(files.benchmark_rates)).length : 0,
          value_added_options: files.value_added_options ? (await this.parseValueAddedOptions(files.value_added_options)).length : 0,
          category_mapping: files.category_mapping ? 50 : 0, // Mock count
          industry_sources: files.industry_sources ? 10 : 0,
          region_mapping: files.region_mapping ? 100 : 0
        },
        validation_errors: [],
        cross_file_errors: [],
        warnings: validation.warnings,
        checksum: validation.checksum
      };

      tag('benchmarks_import_committed', { import_id, mode, recordCount: importRecord.files });
      return { import_id };
    } catch (error) {
      tag('benchmarks_import_commit_failed', { error: error.message });
      throw error;
    }
  }

  async rollback(import_id: string): Promise<{ restored_version_id: string }> {
    try {
      // In a real implementation, this would restore from backup
      const restored_version_id = 'v2024Q4'; // Mock previous version
      
      tag('benchmarks_import_rolled_back', { import_id, restored_version_id });
      return { restored_version_id };
    } catch (error) {
      tag('benchmarks_import_rollback_failed', { import_id, error: error.message });
      throw error;
    }
  }

  private async validateBenchmarkRates(file: File): Promise<{ rowErrors: Array<{ file: string; row: number; errors: string[] }>; warnings: string[] }> {
    const rowErrors: Array<{ file: string; row: number; errors: string[] }> = [];
    const warnings: string[] = [];
    
    const text = await file.text();
    const lines = text.split('\n');
    
    // Check header
    const expectedHeaders = [
      'version_id', 'mode', 'service_level', 'origin_country', 'origin_state', 
      'origin_zip3', 'dest_country', 'dest_state', 'dest_zip3', 'effective_start_date',
      'effective_end_date', 'weight_min_kg', 'weight_max_kg', 'volume_min_cbm', 
      'volume_max_cbm', 'unit', 'rate_benchmark', 'currency', 'accessorial_code',
      'source_tag', 'confidence'
    ];
    
    if (lines.length === 0) {
      rowErrors.push({ file: 'benchmark_rates.csv', row: 1, errors: ['File is empty'] });
      return { rowErrors, warnings };
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      rowErrors.push({ 
        file: 'benchmark_rates.csv', 
        row: 1, 
        errors: [`Missing required headers: ${missingHeaders.join(', ')}`] 
      });
    }

    // Validate data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const errors: string[] = [];
      
      // Check required fields
      if (!values[0]) errors.push('version_id is required');
      if (!values[1]) errors.push('mode is required');
      if (!values[3]) errors.push('origin_country is required');
      if (!values[6]) errors.push('dest_country is required');
      
      // Check numeric fields
      if (values[11] && isNaN(Number(values[11]))) errors.push('weight_min_kg must be numeric');
      if (values[12] && isNaN(Number(values[12]))) errors.push('weight_max_kg must be numeric');
      if (values[16] && isNaN(Number(values[16]))) errors.push('rate_benchmark must be numeric');
      if (values[20] && (isNaN(Number(values[20])) || Number(values[20]) < 0 || Number(values[20]) > 1)) {
        errors.push('confidence must be between 0 and 1');
      }
      
      // Check currency
      if (values[17] && values[17] !== 'USD') {
        errors.push('Only USD currency supported in this phase');
      }
      
      // Check date format (basic ISO check)
      if (values[9] && !/^\d{4}-\d{2}-\d{2}$/.test(values[9])) {
        errors.push('effective_start_date must be in YYYY-MM-DD format');
      }
      if (values[10] && !/^\d{4}-\d{2}-\d{2}$/.test(values[10])) {
        errors.push('effective_end_date must be in YYYY-MM-DD format');
      }
      
      if (errors.length > 0) {
        rowErrors.push({ file: 'benchmark_rates.csv', row: i + 1, errors });
      }
    }
    
    return { rowErrors, warnings };
  }

  private async validateValueAddedOptions(file: File): Promise<{ rowErrors: Array<{ file: string; row: number; errors: string[] }>; warnings: string[] }> {
    const rowErrors: Array<{ file: string; row: number; errors: string[] }> = [];
    const warnings: string[] = [];
    
    const text = await file.text();
    const lines = text.split('\n');
    
    const expectedHeaders = [
      'version_id', 'code', 'name', 'pricing_type', 'unit', 'default_rate',
      'currency', 'category', 'notes', 'source_tag', 'confidence'
    ];
    
    if (lines.length === 0) {
      rowErrors.push({ file: 'value_added_options.csv', row: 1, errors: ['File is empty'] });
      return { rowErrors, warnings };
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      rowErrors.push({ 
        file: 'value_added_options.csv', 
        row: 1, 
        errors: [`Missing required headers: ${missingHeaders.join(', ')}`] 
      });
    }

    // Validate data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const errors: string[] = [];
      
      // Check required fields
      if (!values[0]) errors.push('version_id is required');
      if (!values[1]) errors.push('code is required');
      if (!values[2]) errors.push('name is required');
      if (!values[3]) errors.push('pricing_type is required');
      
      // Check numeric fields
      if (values[5] && isNaN(Number(values[5]))) errors.push('default_rate must be numeric');
      if (values[10] && (isNaN(Number(values[10])) || Number(values[10]) < 0 || Number(values[10]) > 1)) {
        errors.push('confidence must be between 0 and 1');
      }
      
      // Check currency
      if (values[6] && values[6] !== 'USD') {
        errors.push('Only USD currency supported in this phase');
      }
      
      if (errors.length > 0) {
        rowErrors.push({ file: 'value_added_options.csv', row: i + 1, errors });
      }
    }
    
    return { rowErrors, warnings };
  }

  private validateCrossFileIntegrity(files: ImportFiles): string[] {
    const errors: string[] = [];
    
    // Mock cross-file validation
    if (files.benchmark_rates && !files.region_mapping) {
      errors.push('benchmark_rates.csv requires region_mapping.csv for country/state validation');
    }
    
    if (files.value_added_options && !files.category_mapping) {
      errors.push('value_added_options.csv requires category_mapping.csv for category validation');
    }
    
    return errors;
  }

  private async generateChecksum(files: ImportFiles): Promise<string> {
    const fileContents: string[] = [];
    
    for (const [key, file] of Object.entries(files)) {
      if (file) {
        const content = await file.text();
        fileContents.push(`${key}:${content}`);
      }
    }
    
    // Simple checksum for demo - in production use crypto.subtle
    const combined = fileContents.join('|');
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  private async parseBenchmarkRates(file: File): Promise<BenchmarkRate[]> {
    const text = await file.text();
    const lines = text.split('\n');
    const rates: BenchmarkRate[] = [];
    
    if (lines.length < 2) return rates;
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      
      rates.push({
        version_id: values[0] || '',
        mode: values[1] || '',
        service_level: values[2] || '',
        origin_country: values[3] || '',
        origin_state: values[4] || undefined,
        origin_zip3: values[5] || undefined,
        dest_country: values[6] || '',
        dest_state: values[7] || undefined,
        dest_zip3: values[8] || undefined,
        effective_start_date: values[9] || '',
        effective_end_date: values[10] || '',
        weight_min_kg: Number(values[11]) || 0,
        weight_max_kg: Number(values[12]) || 0,
        volume_min_cbm: Number(values[13]) || 0,
        volume_max_cbm: Number(values[14]) || 0,
        unit: values[15] || '',
        rate_benchmark: Number(values[16]) || 0,
        currency: values[17] || 'USD',
        accessorial_code: values[18] || undefined,
        source_tag: values[19] || '',
        confidence: Number(values[20]) || 0
      });
    }
    
    return rates;
  }

  private async parseValueAddedOptions(file: File): Promise<ValueAddedOption[]> {
    const text = await file.text();
    const lines = text.split('\n');
    const options: ValueAddedOption[] = [];
    
    if (lines.length < 2) return options;
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      
      options.push({
        version_id: values[0] || '',
        code: values[1] || '',
        name: values[2] || '',
        pricing_type: values[3] || '',
        unit: values[4] || '',
        default_rate: Number(values[5]) || 0,
        currency: values[6] || 'USD',
        category: values[7] || '',
        notes: values[8] || undefined,
        source_tag: values[9] || '',
        confidence: Number(values[10]) || 0
      });
    }
    
    return options;
  }
}

export const benchmarksImportService = new BenchmarksImportService();