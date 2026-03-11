import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '@/pages/Landing';
import AuthCallback from '@/pages/AuthCallback';
import AuthGuard from '@/components/auth/AuthGuard';

// Placeholder pages for routes not yet implemented
function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <p className="text-[#1E293B] text-xl font-semibold">Dashboard (coming soon)</p>
    </div>
  );
}

function Onboard() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <p className="text-[#1E293B] text-xl font-semibold">Onboarding (coming soon)</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboard" element={<Onboard />} />
      <Route
        path="/dashboard"
        element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
