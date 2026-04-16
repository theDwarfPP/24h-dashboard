import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { AppProvider } from './context/AppContext';

const App = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;