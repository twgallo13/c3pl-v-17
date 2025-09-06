// V17.2.0 — Import Validator (Debugger Tool)
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Upload, FileText, CheckCircle, XCircle, AlertTriangle } from '@phosphor-icons/react';
import { benchmarksImportService, ImportFiles, ValidationResult } from '@/services/benchmarks-import';
import { logEvent, stamp } from '@/lib/build-log';

const tag = stamp('V17.2.0', 'benchmarks');

export function ImportValidator() {
  const [files, setFiles] = useState<ImportFiles>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationHistory, setValidationHistory] = useState<Array<{
    timestamp: string;
    fileCount: number;
    errors: number;
    warnings: number;
    checksum: string;
  }>>([]);

  const fileInputRefs = {
    benchmark_rates: useRef<HTMLInputElement>(null),
    value_added_options: useRef<HTMLInputElement>(null),
    category_mapping: useRef<HTMLInputElement>(null),
    industry_sources: useRef<HTMLInputElement>(null),
    region_mapping: useRef<HTMLInputElement>(null)
  };

  const handleFileChange = (fileType: keyof ImportFiles, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [fileType]: file }));
      // Clear previous validation when files change
      setValidationResult(null);
    }
  };

  const handleValidate = async () => {
    if (Object.keys(files).length === 0) {
      alert('Please select at least one CSV file to validate');
      return;
    }

    setIsValidating(true);
    tag('import_validation_started', { fileCount: Object.keys(files).length });
    
    try {
      const result = await benchmarksImportService.validate(files);
      setValidationResult(result);
      
      // Add to history
      setValidationHistory(prev => [{
        timestamp: new Date().toISOString(),
        fileCount: Object.keys(files).length,
        errors: result.rowErrors.length + result.crossFileErrors.length,
        warnings: result.warnings.length,
        checksum: result.checksum
      }, ...prev.slice(0, 9)]); // Keep last 10 validations
      
      tag('import_validation_completed', { 
        errors: result.rowErrors.length,
        crossFileErrors: result.crossFileErrors.length,
        warnings: result.warnings.length,
        checksum: result.checksum
      });
      
    } catch (error) {
      tag('import_validation_failed', { error: error.message });
      alert(`Validation failed: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const clearFiles = () => {
    setFiles({});
    setValidationResult(null);
    Object.values(fileInputRefs).forEach(ref => {
      if (ref.current) ref.current.value = '';
    });
  };

  const getFileStatusIcon = (fileType: keyof ImportFiles) => {
    if (!files[fileType]) return <FileText className="h-4 w-4 text-muted-foreground" />;
    
    const hasErrors = validationResult?.rowErrors.some(e => e.file.includes(fileType)) || false;
    if (hasErrors) return <XCircle className="h-4 w-4 text-destructive" />;
    
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const getTotalErrors = () => {
    if (!validationResult) return 0;
    return validationResult.rowErrors.length + validationResult.crossFileErrors.length;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Database className="h-4 w-4" />
          Import Validator
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearFiles}>
            Clear
          </Button>
          <Button 
            size="sm" 
            onClick={handleValidate} 
            disabled={isValidating || Object.keys(files).length === 0}
          >
            <Upload className="h-4 w-4 mr-1" />
            {isValidating ? 'Validating...' : 'Validate'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="files" className="w-full">
        <TabsList>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">CSV Files Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'benchmark_rates' as keyof ImportFiles, label: 'Benchmark Rates', required: true },
                  { key: 'value_added_options' as keyof ImportFiles, label: 'Value Added Options', required: true },
                  { key: 'category_mapping' as keyof ImportFiles, label: 'Category Mapping', required: false },
                  { key: 'industry_sources' as keyof ImportFiles, label: 'Industry Sources', required: false },
                  { key: 'region_mapping' as keyof ImportFiles, label: 'Region Mapping', required: false }
                ].map(({ key, label, required }) => (
                  <div key={key} className="flex items-center gap-3">
                    {getFileStatusIcon(key)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="text-xs">{label}</Label>
                        {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </div>
                      <Input
                        ref={fileInputRefs[key]}
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileChange(key, e)}
                        className="text-xs h-8"
                      />
                      {files[key] && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {files[key]!.name} ({Math.round(files[key]!.size / 1024)}KB)
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {isValidating && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Progress className="w-full" />
                  <p className="text-xs text-muted-foreground text-center">
                    Validating {Object.keys(files).length} file(s)...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {validationResult ? (
            <div className="space-y-4">
              {/* Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Validation Summary
                    <Badge variant={getTotalErrors() === 0 ? "default" : "destructive"}>
                      {getTotalErrors() === 0 ? 'PASS' : 'FAIL'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{validationResult.rowErrors.length}</div>
                      <div className="text-muted-foreground">Row Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{validationResult.crossFileErrors.length}</div>
                      <div className="text-muted-foreground">Cross-file Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">{validationResult.warnings.length}</div>
                      <div className="text-muted-foreground">Warnings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{validationResult.checksum}</div>
                      <div className="text-muted-foreground">Checksum</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Row Errors */}
              {validationResult.rowErrors.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Row Errors ({validationResult.rowErrors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {validationResult.rowErrors.map((error, i) => (
                        <div key={i} className="text-xs p-2 bg-destructive/10 rounded border-l-2 border-destructive">
                          <div className="font-semibold">{error.file}:{error.row}</div>
                          <div className="text-muted-foreground">{error.errors.join(', ')}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cross-file Errors */}
              {validationResult.crossFileErrors.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Cross-file Errors ({validationResult.crossFileErrors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {validationResult.crossFileErrors.map((error, i) => (
                        <div key={i} className="text-xs p-2 bg-destructive/10 rounded border-l-2 border-destructive">
                          {error}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Warnings ({validationResult.warnings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {validationResult.warnings.map((warning, i) => (
                        <div key={i} className="text-xs p-2 bg-yellow-50 rounded border-l-2 border-yellow-300">
                          {warning}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Success */}
              {getTotalErrors() === 0 && (
                <Alert className="border-green-500">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    All validations passed! Files are ready for import.
                    {validationResult.warnings.length > 0 && ` (${validationResult.warnings.length} warnings)`}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-8">
              No validation results yet. Upload files and click Validate.
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {validationHistory.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Validation History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {validationHistory.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                      <div className="flex items-center gap-3">
                        <Badge variant={entry.errors === 0 ? "default" : "destructive"} className="text-xs">
                          {entry.errors === 0 ? 'PASS' : 'FAIL'}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                        <span>{entry.fileCount} files</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-red-600">{entry.errors} errors</span>
                        <span className="text-yellow-600">{entry.warnings} warnings</span>
                        <span className="font-mono text-blue-600">{entry.checksum}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-8">
              No validation history yet.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}