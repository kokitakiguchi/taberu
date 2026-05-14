import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Analytics } from './pages/Analytics';
import { Dashboard } from './pages/Dashboard';
import './styles/global.css';

export default function App() {
  return (
    <Router>
      <nav style={{ background: '#4f8ef7', padding: '8px 16px', display: 'flex', gap: 16 }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>
          Taberu
        </Link>
        <Link to="/analytics" style={{ color: '#fff', textDecoration: 'none' }}>
          分析
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Router>
  );
}
