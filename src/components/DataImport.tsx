import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    incidents?: number;
    inspections?: number;
    riskAssessments?: number;
    trainingRecords?: number;
  };
}

export default function DataImport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [recordType, setRecordType] = useState<string>('auto');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setResult({
          success: false,
          message: 'You must be logged in to import data'
        });
        setImporting(false);
        return;
      }

      setUserId(user.id);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      const counts = {
        incidents: 0,
        inspections: 0,
        riskAssessments: 0,
        trainingRecords: 0
      };

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Processing sheet: "${sheetName}" with ${jsonData.length} rows`);

        if (jsonData.length === 0) {
          console.log(`Sheet "${sheetName}" is empty, skipping`);
          continue;
        }

        if (recordType !== 'auto') {
          console.log(`Manually importing sheet "${sheetName}" as ${recordType}`);
          if (recordType === 'incidents') {
            const imported = await importIncidents(jsonData, user.id);
            counts.incidents += imported;
          } else if (recordType === 'inspections') {
            const imported = await importInspections(jsonData, user.id);
            counts.inspections += imported;
          } else if (recordType === 'risk_assessments') {
            const imported = await importRiskAssessments(jsonData, user.id);
            counts.riskAssessments += imported;
          } else if (recordType === 'training') {
            const imported = await importTrainingRecords(jsonData, user.id);
            counts.trainingRecords += imported;
          }
          continue;
        }

        const lowerSheetName = sheetName.toLowerCase();

        const firstRow: any = jsonData[0];
        const columnNames = Object.keys(firstRow);
        console.log(`Detected columns in "${sheetName}":`, columnNames);

        const hasInspectionColumns = firstRow && (
          'MM no.' in firstRow ||
          'Reported by' in firstRow ||
          'Types of Reporting' in firstRow ||
          'Action Taken' in firstRow ||
          'Loc ID' in firstRow
        );

        if (lowerSheetName.includes('near') || lowerSheetName.includes('miss') ||
            (hasInspectionColumns && !lowerSheetName.includes('training') && !lowerSheetName.includes('risk'))) {
          console.log(`Importing sheet "${sheetName}" as inspections (Near Miss/Inspection data detected)`);
          const imported = await importInspections(jsonData, user.id);
          counts.inspections += imported;
        } else if (lowerSheetName.includes('incident')) {
          console.log(`Importing sheet "${sheetName}" as incidents`);
          const imported = await importIncidents(jsonData, user.id);
          counts.incidents += imported;
        } else if (lowerSheetName.includes('inspection') || lowerSheetName.includes('audit')) {
          console.log(`Importing sheet "${sheetName}" as inspections`);
          const imported = await importInspections(jsonData, user.id);
          counts.inspections += imported;
        } else if (lowerSheetName.includes('risk') || lowerSheetName.includes('assessment')) {
          console.log(`Importing sheet "${sheetName}" as risk assessments`);
          const imported = await importRiskAssessments(jsonData, user.id);
          counts.riskAssessments += imported;
        } else if (lowerSheetName.includes('training')) {
          console.log(`Importing sheet "${sheetName}" as training records`);
          const imported = await importTrainingRecords(jsonData, user.id);
          counts.trainingRecords += imported;
        } else if (hasInspectionColumns) {
          console.log(`Importing sheet "${sheetName}" as inspections (inspection columns detected)`);
          const imported = await importInspections(jsonData, user.id);
          counts.inspections += imported;
        } else {
          console.log(`Sheet "${sheetName}" not recognized, skipping`);
        }
      }

      const totalImported = Object.values(counts).reduce((a, b) => a + b, 0);

      setResult({
        success: true,
        message: `Successfully imported ${totalImported} records`,
        details: counts
      });

    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import data'
      });
    } finally {
      setImporting(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const importIncidents = async (data: any[], userId: string): Promise<number> => {
    let count = 0;
    const errors: string[] = [];

    console.log('Starting incident import. First row sample:', data[0]);
    console.log('Available columns:', Object.keys(data[0] || {}));

    for (const row of data) {
      try {
        const incident = {
          user_id: userId,
          ref_no: row['Ref No'] || row.RefNo || row.ref_no || row.ReferenceNo || '',
          incident_type: mapIncidentType(row),
          severity: mapSeverity(row),
          title: row.Title || row.title || row.Type || row.type || row.Description?.substring(0, 100) || 'Imported Incident',
          description: row.Description || row.description || row.Details || '',
          location: row.Location || row.location || row.Site || 'Unknown',
          incident_date: parseDate(row.Date || row.date || row.IncidentDate) || new Date().toISOString(),
          time: parseTime(row.Time || row.time),
          status: mapStatus(row.Status || row.status) || 'open',
          reporter: row.Reporter || row.reporter || row['Reported By'] || row.ReportedBy || '',
          root_cause: row['Root Cause'] || row.RootCause || row.root_cause || row.Cause || '',
          impact: row.Impact || row.impact || row.Effect || '',
          corrective_actions: row['Action Taken'] || row.ActionTaken || row.CorrectiveActions || row.Actions || '',
          recommendations: row.Recommendations || row.recommendations || row.Recommendation || ''
        };

        console.log('Attempting to insert incident:', incident);
        const { error } = await supabase.from('incidents').insert([incident]);
        if (error) {
          console.error('Database error:', error.message, error.details);
          errors.push(error.message);
        } else {
          count++;
        }
      } catch (error) {
        console.error('Error importing incident:', error);
        errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    if (errors.length > 0) {
      console.error(`Failed to import ${errors.length} incidents. Errors:`, errors);
    }

    return count;
  };

  const importInspections = async (data: any[], userId: string): Promise<number> => {
    let count = 0;
    console.log(`Attempting to import ${data.length} inspection records`);

    for (const row of data) {
      try {
        const parsedDate = parseDate(row.Date || row.date || row.InspectionDate || row['Target Date']);
        const inspection = {
          user_id: userId,
          inspection_type: mapInspectionType(row),
          title: row.Issue || row.Title || row.title || row.InspectionName || 'Imported Inspection',
          location: row.Location || row.location || row.Area || '',
          inspection_date: parsedDate || new Date().toISOString(),
          score: parseInt(String(row.Score || row.score || row.Rating || '0').replace(/\D/g, '') || '0'),
          status: mapInspectionStatus(row.Status || row.status),
          findings: row.Findings || row.findings || row.Observations || row.Comments || row.Issue || '',
          time: parseTime(row.Time || row.time),
          reported_by: row['Reported by'] || row.Reporter || row.Inspector || '',
          location_id: String(row['Loc ID'] || row.LocationID || row.LocID || ''),
          issue: row.Issue || row.Description || '',
          reporting_type: row['Types of Reporting'] || row.Type || 'Nearmiss',
          action_taken: row['Action Taken'] || row.Actions || '',
          recommendation: row.Recommendation || row.Recommendations || '',
          responsible_staff: row['Responsible Staff'] || row.Responsible || '',
          target_date: parseDate(row['Target Date'] || row.TargetDate)?.split('T')[0] || null,
          inspector: row.Inspector || row['Reported by'] || ''
        };

        const { error } = await supabase.from('inspections').insert([inspection]);
        if (!error) {
          count++;
        } else {
          console.error('Error inserting inspection:', error.message, 'Row:', row);
        }
      } catch (error) {
        console.error('Error importing inspection row:', error, 'Row:', row);
      }
    }
    console.log(`Successfully imported ${count} inspection records`);
    return count;
  };

  const importRiskAssessments = async (data: any[], userId: string): Promise<number> => {
    let count = 0;
    for (const row of data) {
      try {
        const assessment = {
          user_id: userId,
          title: row.Title || row.title || row.RiskTitle || 'Imported Risk Assessment',
          activity: row.Activity || row.activity || row.Task || row.Process || '',
          hazard_identified: row.Hazard || row.hazard || row.Risk || row.Threat || '',
          likelihood: parseInt(row.Likelihood || row.likelihood || row.Probability || '3'),
          consequence: parseInt(row.Consequence || row.consequence || row.Severity || row.Impact || '3'),
          control_measures: row.Controls || row.controls || row.Mitigation || row.Measures || '',
          status: 'approved'
        };

        const { error } = await supabase.from('risk_assessments').insert([assessment]);
        if (!error) count++;
      } catch (error) {
        console.error('Error importing risk assessment:', error);
      }
    }
    return count;
  };

  const importTrainingRecords = async (data: any[], userId: string): Promise<number> => {
    let count = 0;
    for (const row of data) {
      try {
        const training = {
          user_id: userId,
          training_name: row.TrainingName || row.training || row.Course || row.Title || 'Imported Training',
          training_type: mapTrainingType(row),
          completion_date: parseDate(row.CompletionDate || row.completion || row.Date)?.split('T')[0] || new Date().toISOString().split('T')[0],
          expiry_date: parseDate(row.ExpiryDate || row.expiry)?.split('T')[0] || null,
          certificate_number: row.CertificateNumber || row.certificate || row.CertNo || '',
          status: 'valid'
        };

        const { error } = await supabase.from('training_records').insert([training]);
        if (!error) count++;
      } catch (error) {
        console.error('Error importing training record:', error);
      }
    }
    return count;
  };

  const mapIncidentType = (row: any): string => {
    const type = (row.Type || row.type || row.IncidentType || '').toLowerCase();
    if (type.includes('injury') || type.includes('fall')) return 'injury';
    if (type.includes('death') || type.includes('fatality')) return 'injury';
    if (type.includes('collision') || type.includes('vehicle')) return 'near_miss';
    if (type.includes('near')) return 'near_miss';
    if (type.includes('spill') || type.includes('leak') || type.includes('overflow')) return 'environmental';
    if (type.includes('environment') || type.includes('pipeline')) return 'environmental';
    if (type.includes('electrical') || type.includes('fire') || type.includes('explosion')) return 'hazard';
    if (type.includes('hazard') || type.includes('unsafe')) return 'hazard';
    return 'near_miss';
  };

  const mapSeverity = (row: any): string => {
    const severity = (row.Severity || row.severity || row.Priority || '').toLowerCase();
    const impact = (row.Impact || row.impact || '').toLowerCase();

    if (severity.includes('critical') || severity.includes('high')) return 'critical';
    if (impact.includes('death') || impact.includes('fatal')) return 'critical';
    if (impact.includes('explosion') || impact.includes('injury requiring hospital')) return 'critical';

    if (severity.includes('medium') || severity.includes('moderate')) return 'medium';
    if (impact.includes('spill') || impact.includes('contamination') || impact.includes('environmental')) return 'medium';
    if (impact.includes('damage') || impact.includes('loss')) return 'medium';

    if (severity.includes('low') || severity.includes('minor')) return 'low';
    if (impact.includes('scratch') || impact.includes('minor')) return 'low';

    return 'medium';
  };

  const mapStatus = (status: string | undefined): string => {
    if (!status) return 'open';
    const s = status.toLowerCase();
    if (s.includes('closed') || s.includes('complete')) return 'closed';
    if (s.includes('resolv')) return 'resolved';
    if (s.includes('invest')) return 'investigating';
    return 'open';
  };

  const mapInspectionType = (row: any): string => {
    const type = (row.Type || row.type || row.InspectionType || '').toLowerCase();
    if (type.includes('audit')) return 'audit';
    if (type.includes('emergency')) return 'emergency';
    if (type.includes('planned')) return 'planned';
    return 'routine';
  };

  const mapTrainingType = (row: any): string => {
    const type = (row.Type || row.type || row.Category || '').toLowerCase();
    if (type.includes('environment')) return 'environmental';
    if (type.includes('security')) return 'security';
    if (type.includes('health')) return 'health';
    return 'safety';
  };

  const mapInspectionStatus = (status: string): string => {
    if (!status) return 'scheduled';
    const s = String(status).toLowerCase().trim();
    if (s.includes('closed') || s.includes('complete')) return 'completed';
    if (s.includes('progress') || s.includes('in progress')) return 'in_progress';
    if (s.includes('open') || s.includes('schedule')) return 'scheduled';
    return 'scheduled';
  };

  const parseTime = (timeValue: any): string => {
    if (!timeValue) return '';

    try {
      if (typeof timeValue === 'number') {
        const totalMinutes = Math.round(timeValue * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }

      if (typeof timeValue === 'string') {
        if (timeValue.includes(':')) {
          return timeValue;
        }
        const num = parseFloat(timeValue);
        if (!isNaN(num)) {
          const totalMinutes = Math.round(num * 24 * 60);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
      }
    } catch (error) {
      console.error('Error parsing time:', error);
    }

    return '';
  };

  const parseDate = (dateValue: any): string | null => {
    if (!dateValue) return null;

    try {
      if (typeof dateValue === 'number') {
        const excelDate = XLSX.SSF.parse_date_code(dateValue);
        return new Date(excelDate.y, excelDate.m - 1, excelDate.d).toISOString();
      }

      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      console.error('Error parsing date:', error);
    }

    return null;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <FileSpreadsheet className="text-blue-600" size={32} />
          <h2 className="text-2xl font-bold text-gray-900">Import Data from Excel</h2>
        </div>

        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">Team Collaboration Enabled</h3>
            <p className="text-sm text-blue-800">
              All imported records will be assigned to you, but your team members can view, update statuses,
              and add corrective actions to any record. This ensures seamless collaboration across your organization.
            </p>
          </div>
          <p className="text-gray-600 mb-4">
            Upload your Excel file containing HSSE data. Select the record type below or let the system auto-detect:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>Incidents (injuries, near misses, hazards)</li>
            <li>Inspections and audits</li>
            <li>Risk assessments</li>
            <li>Training records</li>
          </ul>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Import records as:
          </label>
          <select
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={importing}
          >
            <option value="auto">Auto-detect from sheet name</option>
            <option value="incidents">Incidents</option>
            <option value="inspections">Inspections / Near Miss</option>
            <option value="risk_assessments">Risk Assessments</option>
            <option value="training">Training Records</option>
          </select>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
          <Upload className="mx-auto text-gray-400 mb-4" size={48} />
          <label className="cursor-pointer">
            <span className="text-blue-600 hover:text-blue-700 font-semibold">
              Choose Excel file
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
            />
          </label>
          <p className="text-sm text-gray-500 mt-2">Supports .xlsx and .xls files</p>
        </div>

        {importing && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-blue-800">Importing data...</span>
            </div>
          </div>
        )}

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
              ) : (
                <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              )}
              <div>
                <p className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
                {result.details && (
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {result.details.incidents > 0 && (
                      <li>• Incidents: {result.details.incidents}</li>
                    )}
                    {result.details.inspections > 0 && (
                      <li>• Inspections: {result.details.inspections}</li>
                    )}
                    {result.details.riskAssessments > 0 && (
                      <li>• Risk Assessments: {result.details.riskAssessments}</li>
                    )}
                    {result.details.trainingRecords > 0 && (
                      <li>• Training Records: {result.details.trainingRecords}</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
