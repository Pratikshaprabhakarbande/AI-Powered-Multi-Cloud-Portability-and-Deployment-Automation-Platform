/**
 * Cloud Credentials Settings — securely configure AWS/Azure/GCP credentials.
 * Shows connected/disconnected status, test connection, save/remove.
 */
import { useState, useEffect } from 'react';
import useNotification from '../hooks/useNotification.js';
import credentialsService from '../services/credentials.service.js';
import { getErrorMessage } from '../services/api.js';
import Badge from '../components/ui/Badge.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Spinner } from '../components/ui/Loading.jsx';

const PROVIDERS = [
  { key: 'aws', label: 'Amazon Web Services', color: 'border-aws', fields: [
    { name: 'accessKeyId', label: 'Access Key ID', type: 'text', placeholder: 'AKIA...' },
    { name: 'secretAccessKey', label: 'Secret Access Key', type: 'password', placeholder: '••••••••' },
    { name: 'region', label: 'Region', type: 'text', placeholder: 'us-east-1' }
  ]},
  { key: 'azure', label: 'Microsoft Azure', color: 'border-azure', fields: [
    { name: 'clientId', label: 'Client (App) ID', type: 'text', placeholder: '00000000-...' },
    { name: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: '••••••••' },
    { name: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: '00000000-...' },
    { name: 'subscriptionId', label: 'Subscription ID', type: 'text', placeholder: '00000000-...' },
    { name: 'region', label: 'Region', type: 'text', placeholder: 'eastus' }
  ]},
  { key: 'gcp', label: 'Google Cloud Platform', color: 'border-gcp', fields: [
    { name: 'serviceAccountJson', label: 'Service Account JSON', type: 'textarea', placeholder: '{ "type": "service_account", ... }' },
    { name: 'projectId', label: 'Project ID (optional)', type: 'text', placeholder: 'my-project-123' }
  ]}
];

function ProviderCard({ provider, status, onSave, onRemove, onTest }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const { notify } = useNotification();
  const connected = status?.connected;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(provider.key, form);
      setForm({});
      setExpanded(false);
      notify.success(`${provider.label} credentials saved`);
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTest(provider.key);
      setTestResult(res);
      if (res.connected) notify.success(`${provider.label}: connection successful`);
      else notify.error(`${provider.label}: ${res.error || 'connection failed'}`);
    } catch (err) { notify.error(getErrorMessage(err)); setTestResult({ connected: false, error: getErrorMessage(err) }); }
    finally { setTesting(false); }
  };

  const handleRemove = async () => {
    if (!window.confirm(`Remove ${provider.label} credentials?`)) return;
    try {
      await onRemove(provider.key);
      notify.success(`${provider.label} credentials removed`);
    } catch (err) { notify.error(getErrorMessage(err)); }
  };

  return (
    <div className={`card border-l-4 ${provider.color} p-5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 font-bold dark:bg-slate-800">
            {provider.key.toUpperCase().charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{provider.label}</p>
            <Badge status={connected ? 'operational' : 'outage'}>{connected ? 'Connected' : 'Not Connected'}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {connected && (
            <button type="button" className="btn-secondary text-xs" onClick={handleTest} disabled={testing}>
              {testing ? <Spinner size="sm" /> : 'Test'}
            </button>
          )}
          <button type="button" className="btn-secondary text-xs" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Cancel' : connected ? 'Update' : 'Configure'}
          </button>
          {connected && (
            <button type="button" className="text-xs text-red-600 hover:underline" onClick={handleRemove}>Remove</button>
          )}
        </div>
      </div>

      {testResult && (
        <div className={`mt-3 rounded-lg p-3 text-xs ${testResult.connected ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'}`}>
          {testResult.connected ? '✓ Connection successful' : `✗ ${testResult.error || 'Connection failed'}`}
          {testResult.accountId && <span className="ml-2">Account: {testResult.accountId}</span>}
          {testResult.projectId && <span className="ml-2">Project: {testResult.projectId}</span>}
        </div>
      )}

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          {provider.fields.map((f) => (
            <div key={f.name}>
              <label className="label">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea className="input h-24 font-mono text-xs" placeholder={f.placeholder} value={form[f.name] || ''} onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))} />
              ) : (
                <input type={f.type} className="input" placeholder={f.placeholder} value={form[f.name] || ''} onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))} />
              )}
            </div>
          ))}
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size="sm" className="text-white" /> : 'Save Credentials'}
          </button>
          <p className="text-xs text-slate-400">Credentials are encrypted before storage and never exposed in API responses.</p>
        </div>
      )}
    </div>
  );
}

export default function CloudCredentials() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => credentialsService.getStatus().then(setStatus).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSave = async (provider, creds) => {
    const updated = await credentialsService.save(provider, creds);
    setStatus(updated);
  };
  const handleRemove = async (provider) => {
    const updated = await credentialsService.remove(provider);
    setStatus(updated);
  };
  const handleTest = (provider) => credentialsService.test(provider);

  const allConnected = status && status.aws?.connected && status.azure?.connected && status.gcp?.connected;
  const anyConnected = status && (status.aws?.connected || status.azure?.connected || status.gcp?.connected);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cloud Credentials</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Securely configure cloud provider access for live deployments.</p>
      </header>

      {/* Mode banner */}
      <div className={`rounded-lg p-4 text-sm ${anyConnected ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-300' : 'bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-300'}`}>
        <span className="font-medium">{anyConnected ? '🟢 Live Mode' : '🟡 Demo Mode'}</span>
        {' — '}
        {anyConnected ? 'Deployments will use real cloud providers.' : 'Deployments are simulated. Configure credentials below to enable live deployments.'}
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-5 h-24 animate-pulse bg-slate-100 dark:bg-slate-800" />)}</div>
      ) : (
        <div className="space-y-4">
          {PROVIDERS.map((p) => (
            <ProviderCard key={p.key} provider={p} status={status?.[p.key]} onSave={handleSave} onRemove={handleRemove} onTest={handleTest} />
          ))}
        </div>
      )}

      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Security</h3>
        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          <li>• Credentials are encrypted with AES-256-GCM before storage</li>
          <li>• Raw secrets are never returned in API responses</li>
          <li>• Each user's credentials are isolated (per-user encryption)</li>
          <li>• Test Connection uses read-only API calls (no resources created)</li>
        </ul>
      </div>
    </div>
  );
}
