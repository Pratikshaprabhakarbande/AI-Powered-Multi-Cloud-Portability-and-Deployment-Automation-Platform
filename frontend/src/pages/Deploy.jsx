/**
 * Multi-Cloud Deployment page — deploy Docker containers to AWS/Azure/GCP.
 * Shows deployment form, status progression, history, and logs.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi.js';
import useNotification from '../hooks/useNotification.js';
import deployService from '../services/deploy.service.js';
import credentialsService from '../services/credentials.service.js';
import { getErrorMessage } from '../services/api.js';
import StatCard from '../components/ui/StatCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Spinner, CardSkeleton } from '../components/ui/Loading.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';

const PROVIDERS = [
  { key: 'aws', label: 'AWS (ECS/Fargate)', color: 'text-aws' },
  { key: 'azure', label: 'Azure (Container Instances)', color: 'text-azure' },
  { key: 'gcp', label: 'GCP (Cloud Run)', color: 'text-gcp' }
];

const STATUS_LABELS = {
  pending: { label: 'Queued', color: 'bg-slate-400' },
  in_progress: { label: 'Deploying', color: 'bg-blue-500 animate-pulse' },
  success: { label: 'Running', color: 'bg-green-500' },
  failed: { label: 'Failed', color: 'bg-red-500' },
  rolled_back: { label: 'Rolled Back', color: 'bg-purple-500' },
  destroyed: { label: 'Terminated', color: 'bg-slate-600' }
};

function StatusDot({ status }) {
  const meta = STATUS_LABELS[status] || STATUS_LABELS.pending;
  return (
    <span className="flex items-center gap-2 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
      {meta.label}
    </span>
  );
}

export default function Deploy() {
  const { notify } = useNotification();
  const [provider, setProvider] = useState('aws');
  const [regions, setRegions] = useState([]);
  const [form, setForm] = useState({ image: '', region: '', name: '' });
  const [deploying, setDeploying] = useState(false);
  const [activeDeployment, setActiveDeployment] = useState(null);
  const [polling, setPolling] = useState(false);

  const history = useApi(() => deployService.list({ limit: 10 }), [activeDeployment?.status]);
  const [credStatus, setCredStatus] = useState(null);

  // Check credential status on mount
  useEffect(() => {
    credentialsService.getStatus().then(setCredStatus).catch(() => {});
  }, []);

  const isLiveMode = credStatus && (credStatus.aws?.connected || credStatus.azure?.connected || credStatus.gcp?.connected);

  // Load regions when provider changes
  useEffect(() => {
    deployService.regions(provider).then(setRegions).catch(() => setRegions([]));
  }, [provider]);

  // Poll active deployment status
  useEffect(() => {
    if (!activeDeployment || !['pending', 'in_progress'].includes(activeDeployment.status)) return;
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const updated = await deployService.get(activeDeployment.id);
        setActiveDeployment(updated);
        if (!['pending', 'in_progress'].includes(updated.status)) {
          clearInterval(interval);
          setPolling(false);
          history.refetch();
          if (updated.status === 'success') notify.success(`Deployment ${updated.name} is running!`);
          else if (updated.status === 'failed') notify.error(`Deployment ${updated.name} failed.`);
        }
      } catch { clearInterval(interval); setPolling(false); }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeDeployment?.id, activeDeployment?.status]);

  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!form.image) { notify.error('Docker image is required'); return; }
    setDeploying(true);
    try {
      const dep = await deployService.create({ provider, ...form });
      setActiveDeployment(dep);
      notify.success(`Deployment ${dep.name} queued (${dep.mode} mode)`);
      setForm({ image: '', region: '', name: '' });
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setDeploying(false); }
  };

  const handleRollback = async (id) => {
    try {
      const updated = await deployService.rollback(id);
      setActiveDeployment(updated);
      notify.success('Deployment rolled back');
      history.refetch();
    } catch (err) { notify.error(getErrorMessage(err)); }
  };

  const runs = history.data?.results || [];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Deploy</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Deploy Docker containers to AWS, Azure, or GCP.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${isLiveMode ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
            <span className={`h-2 w-2 rounded-full ${isLiveMode ? 'bg-green-500' : 'bg-amber-500'}`} />
            {isLiveMode ? 'Live Mode' : 'Demo Mode'}
          </span>
          {!isLiveMode && <Link to="/cloud-credentials" className="text-xs text-brand-600 hover:underline">Configure credentials →</Link>}
        </div>
      </header>

      {/* Demo mode banner */}
      {!isLiveMode && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <strong>Running in Demo Mode</strong> — Deployments are simulated with realistic status progression. <Link to="/cloud-credentials" className="font-medium underline">Configure cloud credentials</Link> to enable live deployments.
        </div>
      )}

      {/* Deploy form */}
      <form onSubmit={handleDeploy} className="card p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">New deployment</h3>

        {/* Provider selector */}
        <div>
          <label className="label">Cloud Provider</label>
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map((p) => (
              <button key={p.key} type="button" onClick={() => setProvider(p.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium border transition ${provider === p.key ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Docker Image *</label>
            <input className="input" placeholder="nginx:latest" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} disabled={deploying} />
          </div>
          <div>
            <label className="label">Region</label>
            <select className="input" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} disabled={deploying}>
              <option value="">Default</option>
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Name (optional)</label>
            <input className="input" placeholder="my-app" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={deploying} />
          </div>
        </div>

        <button type="submit" disabled={deploying} className="btn-primary">
          {deploying ? <Spinner size="sm" className="text-white" /> : 'Deploy'}
        </button>
      </form>

      {/* Active deployment status */}
      {activeDeployment && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">{activeDeployment.name}</h3>
            <StatusDot status={activeDeployment.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><span className="text-slate-400">Provider</span><p className="font-medium uppercase">{activeDeployment.provider}</p></div>
            <div><span className="text-slate-400">Region</span><p className="font-medium">{activeDeployment.region}</p></div>
            <div><span className="text-slate-400">Image</span><p className="font-medium truncate">{activeDeployment.image}</p></div>
            <div><span className="text-slate-400">Mode</span><p className="font-medium">{activeDeployment.mode}</p></div>
          </div>

          {activeDeployment.resourceId && (
            <div className="text-xs"><span className="text-slate-400">Resource ID: </span><code className="text-slate-600 dark:text-slate-300 break-all">{activeDeployment.resourceId}</code></div>
          )}

          {activeDeployment.logs && (
            <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">{activeDeployment.logs}</pre>
          )}

          {activeDeployment.status === 'success' && activeDeployment.isRollbackable !== false && (
            <button type="button" className="btn border border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300" onClick={() => handleRollback(activeDeployment.id)}>
              Rollback
            </button>
          )}

          {polling && <p className="text-xs text-slate-400 animate-pulse">Polling status...</p>}
        </div>
      )}

      {/* Deployment history */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">Deployment history</h3>
          <button type="button" className="text-xs text-brand-600 hover:underline" onClick={history.refetch}>Refresh</button>
        </div>
        {history.loading ? <div className="p-5"><CardSkeleton /></div> :
         history.error ? <div className="p-5"><ErrorState message={history.error} onRetry={history.refetch} /></div> :
         runs.length === 0 ? <div className="px-5 py-10 text-center text-sm text-slate-400">No deployments yet. Create your first deployment above.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Region</th>
                  <th className="px-5 py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {runs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer" onClick={() => deployService.get(d.id).then(setActiveDeployment)}>
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{d.name}</td>
                    <td className="px-5 py-3 uppercase text-slate-600 dark:text-slate-300">{d.provider}</td>
                    <td className="px-5 py-3"><Badge status={d.status} /></td>
                    <td className="px-5 py-3 text-slate-500">{d.region}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
