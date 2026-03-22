import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import { AuthGuard, OnboardGuard } from '@/components/guards/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';

import Landing from '@/pages/Landing';
import AuthCallback from '@/pages/AuthCallback';
import JoinPage from '@/pages/JoinPage';
import Onboarding from '@/pages/Onboarding';
import Welcome from '@/pages/Welcome';
import Dashboard from '@/pages/Dashboard';
import Directory from '@/pages/Directory';
import MapPage from '@/pages/MapPage';
import Profile from '@/pages/Profile';
import ProfileEdit from '@/pages/ProfileEdit';
import Messages from '@/pages/Messages';
import Conversation from '@/pages/Conversation';
import Sessions from '@/pages/Sessions';
import SessionNew from '@/pages/SessionNew';
import SessionDetail from '@/pages/SessionDetail';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/join/:token" element={<JoinPage />} />

        {/* Auth required, not necessarily onboarded */}
        <Route element={<AuthGuard />}>
          <Route path="/onboard" element={<Onboarding />} />
          <Route path="/welcome" element={<Welcome />} />
        </Route>

        {/* Auth + onboarded required — wrapped in AppShell */}
        <Route element={<OnboardGuard />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:userId" element={<Conversation />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/sessions/new" element={<SessionNew />} />
            <Route path="/sessions/:id" element={<SessionDetail />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
