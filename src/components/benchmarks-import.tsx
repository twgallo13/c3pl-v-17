// V17.2.0 — Benchmarks Import Screen (Admin Only)
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Upload, FileText, AlertTriangle, CheckCircle, XCircle, RotateCcw } from '@phosphor-icons/react';
import { UserRole } from '@/lib/types';
import { VersionDisplay } from '@/components/version-display';
import { benchmarksImportService, ImportFiles, ValidationResult, DryRunResult } from '@/services/benchmarks-import';
import { logEvent, stamp } from '@/lib/build-log';

const tag = stamp('V17.2.0', 'benchmarks');

interface BenchmarksImportProps {
  userRole: UserRole;
  onBack: () => void;
}

export function BenchmarksImport({ userRole, onBack }: BenchmarksImportProps) {
  const [versionId, setVersionId] = useState(`v${new Date().getFullYear()}Q${Math.ceil((new Date().getMonth() + 1) / 3)}`);
  const [files, setFiles] = useState<ImportFiles>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<Array<{ timestamp: string; action: string; details: string }>>([]);

  const fileRefs = {
    benchmarkRates: useRef<HTMLInputElement>(null),
    valueAddedOptions: useRef<HTMLInputElement>(null),
    categoryMapping: useRef<HTMLInputElement>(null),
    industrySources: useRef<HTMLInputElement>(null),
    regionMapping: useRef<HTMLInputElement>(null)
  };

  // RBAC check
  if (userRole !== 'Admin') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">Benchmarks import requires Admin role</p>
            <Button onClick={onBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleFileChange = (fileType: keyof ImportFiles, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [fileType]: file }));
      addToAuditLog(`File selected: ${fileType} - ${file.name}`);
      
      // Clear previous validation when files change
      setValidationResult(null);
      setDryRunResult(null);
    }
  };

  const addToAuditLog = (action: string, details?: string) => {
    setAuditLog(prev => [{
      timestamp: new Date().toISOString(),
      action,
      details: details || ''
    }, ...prev.slice(0, 99)]); // Keep last 100 entries
  };

  const handleValidate = async () => {
    if (Object.keys(files).length === 0) {
      alert('Please select at least one file to validate');
      return;
    }

    setIsValidating(true);
    addToAuditLog('Validation started');
    
    try {
      const result = await benchmarksImportService.validate(files);
      setValidationResult(result);
      
      if (result.rowErrors.length === 0 && result.crossFileErrors.length === 0) {
        addToAuditLog('Validation passed', `Checksum: ${result.checksum}`);
      } else {
        addToAuditLog('Validation failed', `${result.rowErrors.length} row errors, ${result.crossFileErrors.length} cross-file errors`);
      }
    } catch (error) {
      addToAuditLog('Validation error', error.message);
      alert(`Validation failed: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDryRun = async () => {
    if (!validationResult || validationResult.rowErrors.length > 0) {
      alert('Please complete validation successfully before running dry-run');
      return;
    }

    addToAuditLog('Dry-run started');
    
    try {
      const result = await benchmarksImportService.dryRun(files);
      setDryRunResult(result);
      addToAuditLog('Dry-run completed', `${result.inserts} inserts, ${result.updates} updates, ${result.deletes} deletes`);
    } catch (error) {
      addToAuditLog('Dry-run error', error.message);
      alert(`Dry-run failed: ${error.message}`);
    }
  };

  const handleImport = async (mode: 'replace' | 'upsert') => {
    if (!dryRunResult) {
      alert('Please complete dry-run before importing');
      return;
    }

    const confirmed = confirm(`Are you sure you want to ${mode} benchmarks? This action cannot be undone.`);
    if (!confirmed) return;

    setIsImporting(true);
    addToAuditLog(`Import started (${mode})`);
    
    try {
      const result = await benchmarksImportService.commit(files, mode);
      setImportSuccess(result.import_id);
      addToAuditLog('Import completed', `Import ID: ${result.import_id}`);
      
      // Clear files after successful import
      setFiles({});
      setValidationResult(null);
      setDryRunResult(null);
      
      // Reset file inputs
      Object.values(fileRefs).forEach(ref => {
        if (ref.current) ref.current.value = '';
      });
    } catch (error) {
      addToAuditLog('Import error', error.message);
      alert(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleRollback = async () => {
    const importId = prompt('Enter Import ID to rollback:');
    if (!importId) return;

    const confirmed = confirm(`Are you sure you want to rollback import ${importId}?`);
    if (!confirmed) return;

    addToAuditLog(`Rollback started for ${importId}`);
    
    try {
      const result = await benchmarksImportService.rollback(importId);
      addToAuditLog('Rollback completed', `Restored to version: ${result.restored_version_id}`);
      alert(`Successfully rolled back to version: ${result.restored_version_id}`);
    } catch (error) {
      addToAuditLog('Rollback error', error.message);
      alert(`Rollback failed: ${error.message}`);
    }
  };

  const getFileStatusIcon = (fileType: keyof ImportFiles) => {
    if (!files[fileType]) return <FileText className="h-4 w-4 text-muted-foreground" />;
    
    const hasErrors = validationResult?.rowErrors.some(e => e.file.includes(fileType)) || false;
    if (hasErrors) return <XCircle className="h-4 w-4 text-destructive" />;
    
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Benchmarks Import</h1>
            <p className="text-muted-foreground">Import and manage benchmark data versions</p>
          </div>
        </div>
        <VersionDisplay />
      </div>

      {/* Version ID Input */}
      <Card>
        <CardHeader>
          <CardTitle>Import Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="version-id">Version ID</Label>
              <Input
                id="version-id"
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
                placeholder="e.g., v2025Q1"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleRollback}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Rollback Import
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Uploads */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'benchmark_rates' as keyof ImportFiles, label: 'Benchmark Rates', required: true },
              { key: 'value_added_options' as keyof ImportFiles, label: 'Value Added Options', required: true },
              { key: 'category_mapping' as keyof ImportFiles, label: 'Category Mapping', required: false },
              { key: 'industry_sources' as keyof ImportFiles, label: 'Industry Sources', required: false },
              { key: 'region_mapping' as keyof ImportFiles, label: 'Region Mapping', required: false }
            ].map(({ key, label, required }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2">
                  {getFileStatusIcon(key)}
                  <Label>{label}</Label>
                  {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </div>
                <Input
                  ref={fileRefs[key as keyof typeof fileRefs]}
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileChange(key, e)}
                />
                {files[key] && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {files[key]!.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={handleValidate} 
              disabled={isValidating || Object.keys(files).length === 0}
            >
              {isValidating ? (
                <>
                  <Progress className="w-4 h-4 mr-2" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validate
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleDryRun}
              disabled={!validationResult || validationResult.rowErrors.length > 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Dry Run
            </Button>
            
            <Button 
              onClick={() => handleImport('replace')}
              disabled={!dryRunResult || isImporting}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import (Replace)
            </Button>
            
            <Button 
              onClick={() => handleImport('upsert')}
              disabled={!dryRunResult || isImporting}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import (Upsert)
            </Button>
          </div>
          
          {isImporting && (
            <div className="mt-4">
              <Progress className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">Import in progress...</p>
            </div>
          )}
          
          {importSuccess && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Import completed successfully! Import ID: {importSuccess}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Tabs */}
      {(validationResult || dryRunResult || auditLog.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="validation">
              <TabsList>
                <TabsTrigger value="validation">Validation</TabsTrigger>
                <TabsTrigger value="dry-run">Dry Run</TabsTrigger>
                <TabsTrigger value="audit">Audit Log</TabsTrigger>
              </TabsList>
              
              <TabsContent value="validation" className="space-y-4">
                {validationResult ? (
                  <>
                    {validationResult.rowErrors.length > 0 && (
                      <Alert className="border-destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-semibold mb-2">Row-level Errors ({validationResult.rowErrors.length})</div>
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {validationResult.rowErrors.map((error, i) => (
                              <div key={i} className="text-sm">
                                <strong>{error.file}:{error.row}</strong> - {error.errors.join(', ')}
                              </div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {validationResult.crossFileErrors.length > 0 && (
                      <Alert className="border-destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-semibold mb-2">Cross-file Errors</div>
                          {validationResult.crossFileErrors.map((error, i) => (
                            <div key={i} className="text-sm">{error}</div>
                          ))}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {validationResult.warnings.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-semibold mb-2">Warnings</div>
                          {validationResult.warnings.map((warning, i) => (
                            <div key={i} className="text-sm">{warning}</div>
                          ))}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {validationResult.rowErrors.length === 0 && validationResult.crossFileErrors.length === 0 && (
                      <Alert className="border-green-500">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Validation passed! Checksum: {validationResult.checksum}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No validation results yet</p>
                )}
              </TabsContent>
              
              <TabsContent value="dry-run">
                {dryRunResult ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{dryRunResult.inserts}</div>
                      <div className="text-sm text-muted-foreground">Inserts</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{dryRunResult.updates}</div>
                      <div className="text-sm text-muted-foreground">Updates</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{dryRunResult.deletes}</div>
                      <div className="text-sm text-muted-foreground">Deletes</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{dryRunResult.previewCount}</div>
                      <div className="text-sm text-muted-foreground">Total Records</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No dry-run results yet</p>
                )}
              </TabsContent>
              
              <TabsContent value="audit">
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {auditLog.map((entry, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="text-xs text-muted-foreground min-w-0 flex-shrink-0">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{entry.action}</div>
                        {entry.details && (
                          <div className="text-sm text-muted-foreground">{entry.details}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}