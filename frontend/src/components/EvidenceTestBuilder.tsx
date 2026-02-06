import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from './Toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editTest?: any;
}

interface System { id: string; name: string; }
interface Framework { id: string; name: string; }
interface Control { id: string; control_id: string; title: string; }
interface Connector { id: string; name: string; type: string; }

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'exists', label: 'Exists' },
  { value: 'not_empty', label: 'Not Empty' },
];

const SCHEDULES = [
  { value: 'manual', label: 'Manual' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function EvidenceTestBuilder({ isOpen, onClose, onSaved, editTest }: Props) {
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: System & Control
  const [systems, setSystems] = useState<System[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [selectedSystem, setSelectedSystem] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');
  const [selectedControl, setSelectedControl] = useState('');

  // Step 2: Test Type & Configuration
  const [testType, setTestType] = useState<'api' | 'manual'>('api');
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selectedConnector, setSelectedConnector] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [urlPath, setUrlPath] = useState('');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('{}');
  const [responsePath, setResponsePath] = useState('');

  // Step 3: Pass Criteria
  const [operator, setOperator] = useState('equals');
  const [expectedValue, setExpectedValue] = useState('');
  const [threshold, setThreshold] = useState('');

  // Step 4: Schedule & Alerts
  const [schedule, setSchedule] = useState('manual');
  const [alertOnFail, setAlertOnFail] = useState(true);
  const [testName, setTestName] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSystems();
      fetchFrameworks();
      fetchConnectors();
      if (editTest) populateFromEdit(editTest);
    }
  }, [isOpen, editTest]);

  useEffect(() => {
    if (selectedSystem && selectedFramework) {
      fetchControls();
    }
  }, [selectedSystem, selectedFramework]);

  const fetchSystems = async () => {
    try {
      const data = await api<{ systems: System[] }>('/api/v1/systems');
      setSystems(data.systems || []);
    } catch { /* handled by api error listener */ }
  };

  const fetchFrameworks = async () => {
    try {
      const data = await api<{ frameworks: Framework[] }>('/api/v1/frameworks');
      setFrameworks(data.frameworks || []);
    } catch { /* handled by api error listener */ }
  };

  const fetchControls = async () => {
    try {
      const data = await api<{ controls: Control[] }>(
        `/api/v1/controls?system_id=${selectedSystem}&framework_id=${selectedFramework}`
      );
      setControls(data.controls || []);
    } catch { /* handled by api error listener */ }
  };

  const fetchConnectors = async () => {
    try {
      const data = await api<{ connectors: Connector[] }>('/api/v1/connectors');
      setConnectors(data.connectors || []);
    } catch { /* handled by api error listener */ }
  };

  const populateFromEdit = (test: any) => {
    setSelectedSystem(test.system_id || '');
    setSelectedFramework(test.framework_id || '');
    setSelectedControl(test.control_id || '');
    setTestType(test.test_type || 'api');
    setSelectedConnector(test.connector_id || '');
    setMethod(test.method || 'GET');
    setUrlPath(test.url_path || '');
    setHeaders(JSON.stringify(test.headers || {}, null, 2));
    setBody(JSON.stringify(test.body || {}, null, 2));
    setResponsePath(test.response_path || '');
    setOperator(test.operator || 'equals');
    setExpectedValue(test.expected_value || '');
    setThreshold(test.threshold?.toString() || '');
    setSchedule(test.schedule || 'manual');
    setAlertOnFail(test.alert_on_fail ?? true);
    setTestName(test.name || '');
  };

  const resetForm = () => {
    setStep(1);
    setSelectedSystem('');
    setSelectedFramework('');
    setSelectedControl('');
    setTestType('api');
    setSelectedConnector('');
    setMethod('GET');
    setUrlPath('');
    setHeaders('{}');
    setBody('{}');
    setResponsePath('');
    setOperator('equals');
    setExpectedValue('');
    setThreshold('');
    setSchedule('manual');
    setAlertOnFail(true);
    setTestName('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        name: testName,
        system_id: selectedSystem,
        framework_id: selectedFramework,
        control_id: selectedControl,
        test_type: testType,
        connector_id: testType === 'api' ? selectedConnector : null,
        method: testType === 'api' ? method : null,
        url_path: testType === 'api' ? urlPath : null,
        headers: testType === 'api' ? JSON.parse(headers) : null,
        body: testType === 'api' && method === 'POST' ? JSON.parse(body) : null,
        response_path: testType === 'api' ? responsePath : null,
        operator,
        expected_value: expectedValue,
        threshold: threshold ? parseFloat(threshold) : null,
        schedule,
        alert_on_fail: alertOnFail,
      };

      if (editTest?.id) {
        await api(`/api/v1/evidence/tests/${editTest.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        addToast({ type: 'success', title: 'Test updated successfully' });
      } else {
        await api('/api/v1/evidence/tests', { method: 'POST', body: JSON.stringify(payload) });
        addToast({ type: 'success', title: 'Test created successfully' });
      }
      onSaved();
      handleClose();
    } catch {
      addToast({ type: 'error', title: 'Failed to save test' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const canProceed = () => {
    if (step === 1) return selectedSystem && selectedFramework && selectedControl;
    if (step === 2) return testType === 'manual' || (selectedConnector && urlPath);
    if (step === 3) return operator && (operator === 'exists' || operator === 'not_empty' || expectedValue);
    if (step === 4) return testName.trim();
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editTest ? 'Edit Evidence Test' : 'Create Evidence Test'}
          </h2>
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s ? 'bg-blue-600 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 4 && <div className={`w-12 h-0.5 ${step > s ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select System & Control</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">System</label>
                <select value={selectedSystem} onChange={(e) => setSelectedSystem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">Select a system...</option>
                  {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Framework</label>
                <select value={selectedFramework} onChange={(e) => setSelectedFramework(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">Select a framework...</option>
                  {frameworks.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Control</label>
                <select value={selectedControl} onChange={(e) => setSelectedControl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">Select a control...</option>
                  {controls.map((c) => <option key={c.id} value={c.id}>{c.control_id} - {c.title}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configure Test Type</h3>
              <div className="flex gap-4">
                {['api', 'manual'].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="testType" checked={testType === type} onChange={() => setTestType(type as 'api' | 'manual')}
                      className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-900 dark:text-white capitalize">{type === 'api' ? 'API Test' : 'Manual Check'}</span>
                  </label>
                ))}
              </div>
              {testType === 'api' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Connector</label>
                    <select value={selectedConnector} onChange={(e) => setSelectedConnector(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="">Select a connector...</option>
                      {connectors.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</label>
                      <select value={method} onChange={(e) => setMethod(e.target.value as 'GET' | 'POST')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Path</label>
                      <input type="text" value={urlPath} onChange={(e) => setUrlPath(e.target.value)} placeholder="/api/endpoint"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Headers (JSON)</label>
                    <textarea value={headers} onChange={(e) => setHeaders(e.target.value)} rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm" />
                  </div>
                  {method === 'POST' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body (JSON)</label>
                      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Response Path</label>
                    <input type="text" value={responsePath} onChange={(e) => setResponsePath(e.target.value)} placeholder="data.users.count"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JSON path to extract value from response</p>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Define Pass Criteria</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Operator</label>
                <select value={operator} onChange={(e) => setOperator(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  {OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                </select>
              </div>
              {!['exists', 'not_empty'].includes(operator) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Value</label>
                  <input type="text" value={expectedValue} onChange={(e) => setExpectedValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              )}
              {['greater_than', 'less_than'].includes(operator) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Threshold</label>
                  <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Schedule & Alerts</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Name</label>
                <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="e.g., Check user count > 100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Schedule</label>
                <div className="flex flex-wrap gap-3">
                  {SCHEDULES.map((s) => (
                    <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="schedule" checked={schedule === s.value} onChange={() => setSchedule(s.value)}
                        className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-900 dark:text-white">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setAlertOnFail(!alertOnFail)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${alertOnFail ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${alertOnFail ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-gray-900 dark:text-white">Alert on failure</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button onClick={step > 1 ? () => setStep(step - 1) : handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canProceed()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          ) : (
            <button onClick={handleSave} disabled={!canProceed() || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Saving...' : editTest ? 'Update Test' : 'Create Test'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
