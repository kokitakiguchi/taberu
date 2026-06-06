import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Analytics } from './pages/Analytics';
import { Dashboard } from './pages/Dashboard';
import './styles/global.css';

export default function App() {
  return (
    <Router>
      <nav className="app-nav">
        <Link to="/" className="brand">
          Taberu
        </Link>
        <Link to="/analytics">分析</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Router>
  );
}
