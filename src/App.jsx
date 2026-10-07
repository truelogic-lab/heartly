import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './context/SessionContext.jsx';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import SplashPage from './pages/SplashPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import SwipePage from './pages/SwipePage.jsx';
import MatchPage from './pages/MatchPage.jsx';
import ChatListPage from './pages/ChatListPage.jsx';
import ChatThreadPage from './pages/ChatThreadPage.jsx';
import InterestsPage from './pages/InterestsPage.jsx';
import BirthdatePage from './pages/onboarding/BirthdatePage.jsx';
import GenderPage from './pages/onboarding/GenderPage.jsx';
import LocationPage from './pages/onboarding/LocationPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import RequestsPage from './pages/RequestsPage.jsx';
import SettingsPage from './pages/profile/SettingsPage.jsx';
import PhotosPage from './pages/profile/PhotosPage.jsx';
import LanguagePage from './pages/profile/LanguagePage.jsx';
import NotificationsPage from './pages/profile/NotificationsPage.jsx';
import PrivacyPage from './pages/profile/PrivacyPage.jsx';
import HelpPage from './pages/profile/HelpPage.jsx';
import PublicProfilePage from './pages/PublicProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  const { loading } = useSession();

  if (loading) {
    return <BootScreen />;
  }

  return (
    <Routes>
      {/* Unauthenticated */}
      <Route path="/splash" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated — wrapped in the app shell with bottom tabs */}
      <Route element={<ProtectedRoute />}>
        <Route path="/interests" element={<InterestsPage />} />
        <Route path="/onboarding/birthdate" element={<BirthdatePage />} />
        <Route path="/onboarding/gender" element={<GenderPage />} />
        <Route path="/onboarding/location" element={<LocationPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/match/:matchId" element={<MatchPage />} />
        <Route path="/chat/:matchId" element={<ChatThreadPage />} />

        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/swipe" element={<SwipePage />} />
          <Route path="/chat" element={<ChatListPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/requests" element={<RequestsPage />} />
            <Route path="/profile/photos" element={<PhotosPage />} />
            <Route path="/profile/settings" element={<SettingsPage />} />
            <Route path="/profile/language" element={<LanguagePage />} />
            <Route path="/profile/notifications" element={<NotificationsPage />} />
            <Route path="/profile/privacy" element={<PrivacyPage />} />
            <Route path="/profile/help" element={<HelpPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

/* Full-viewport loading screen shown while we restore the session */
function BootScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0b0f',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '3px solid rgba(255,59,92,0.2)',
            borderTopColor: '#FF3B5C',
            animation: 'spin 0.9s linear infinite',
          }}
        />
        <p style={{ color: '#9a9aa6', fontSize: 14, margin: 0 }}>Loading…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
