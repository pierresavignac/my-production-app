import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProductionCalendar from './components/ProductionCalendar';
import LoginForm from './components/auth/LoginForm';
import UserManagement from './components/admin/UserManagement';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SideMenu from './components/layout/SideMenu';
import './App.css';

function App() {
  return (
    <Router>
      <SideMenu />
      <div className="App main-content-area">
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute>
                <ProductionCalendar />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/list-view" 
            element={
              <ProtectedRoute>
                <div>Page Vue Liste (à créer)</div> 
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users"
            element={
              <ProtectedRoute>
                <div>Page de gestion des usagers (à créer)</div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/calendar" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
