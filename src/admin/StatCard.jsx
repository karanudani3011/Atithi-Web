import { motion } from 'framer-motion';
import Counter from '../components/Counter.jsx';
export default function StatCard({ label, value, icon: Icon, format = 'number', delay = 0, subtitle, loading = false, error = false, onRetry }) {
  return <motion.article className="admin-stat" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: .35 }}>
    <div className="admin-stat-icon"><Icon size={20}/></div><span>{label}</span>
    <strong className={error ? 'has-error' : ''}>{loading ? <i className="admin-stat-skeleton-value" aria-label="Loading"/> : error ? "Couldn't load" : <>{format === 'currency' ? '₹' : ''}{value == null ? '—' : <Counter to={Number(value) || 0}/>}</>}</strong>
    {subtitle && <small className="admin-stat-subtitle">{subtitle}</small>}
    {error && <button type="button" className="admin-stat-retry" onClick={onRetry}>Retry</button>}
  </motion.article>;
}
