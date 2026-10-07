import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import AppHeader from './components/AppHeader.jsx';
import Hero from './components/Hero.jsx';
import FeatureStrip from './components/FeatureStrip.jsx';
import MeetSingles from './components/MeetSingles.jsx';
import Safety from './components/Safety.jsx';
import Footer from './components/Footer.jsx';
import OpenAppBanner from './components/OpenAppBanner.jsx';

import SplashPage from './pages/SplashPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import UploadPhotosPage from './pages/UploadPhotosPage.jsx';
import PhoneNumberPage from './pages/PhoneNumberPage.jsx';
import FindTheOnePage from './pages/FindTheOnePage.jsx';
import SearchPartnersPage from './pages/SearchPartnersPage.jsx';
import MatchPage from './pages/MatchPage.jsx';
import DiscoverPage from './pages/DiscoverPage.jsx';
import DiscoverByInterestPage from './pages/DiscoverByInterestPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ChatConversationPage from './pages/ChatConversationPage.jsx';
import LikesPage from './pages/LikesPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import MyAccountPage from './pages/profile/MyAccountPage.jsx';
import SettingsPage from './pages/profile/SettingsPage.jsx';
import LanguagePage from './pages/profile/LanguagePage.jsx';
import NotificationsPage from './pages/profile/NotificationsPage.jsx';
import PrivacyPage from './pages/profile/PrivacyPage.jsx';
import HelpPage from './pages/profile/HelpPage.jsx';
import StatesPreviewPage from './pages/StatesPreviewPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function LandingPage() {
  return (<><Hero /><FeatureStrip /><MeetSingles /><Safety /></>);
}

/* Full-screen — no header (splash, onboarding, upload, phone, match) */
function FullScreenShell({ children }) {
  return <div className="app-screen app-screen--full">{children}</div>;
}

/* App screens with sticky header */
function AppShell({ children }) {
  return (
    <div className="app-screen">
      <AppHeader />
      <div className="app-screen__body">{children}</div>
    </div>
  );
}

const ComingSoon = ({ label }) => (
  <AppShell><div style={{ padding: 40, textAlign: 'center' }}>{label} — coming soon</div></AppShell>
);

export default function App() {
  return (
    <Routes>
      {/* Auth pages — standalone */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Full-screen app flow — no header (keeps focus on onboarding) */}
      <Route path="/splash" element={<FullScreenShell><SplashPage /></FullScreenShell>} />
      <Route path="/onboarding" element={<FullScreenShell><OnboardingPage /></FullScreenShell>} />
      <Route path="/upload-photos" element={<FullScreenShell><UploadPhotosPage /></FullScreenShell>} />
      <Route path="/phone-number" element={<FullScreenShell><PhoneNumberPage /></FullScreenShell>} />
      <Route path="/match" element={<FullScreenShell><MatchPage /></FullScreenShell>} />

      {/* App screens — with header */}
      <Route path="/find-the-one" element={<AppShell><FindTheOnePage /></AppShell>} />
      <Route path="/search-partners" element={<AppShell><SearchPartnersPage /></AppShell>} />
      <Route path="/discover" element={<AppShell><DiscoverPage /></AppShell>} />
      <Route path="/discover-by-interest" element={<AppShell><DiscoverByInterestPage /></AppShell>} />
      <Route path="/chat" element={<AppShell><ChatPage /></AppShell>} />
      <Route path="/chat/:id" element={<AppShell><ChatConversationPage /></AppShell>} />
      <Route path="/likes" element={<AppShell><LikesPage /></AppShell>} />
      <Route path="/profile" element={<AppShell><ProfilePage /></AppShell>} />

      <Route path="/profile/account" element={<AppShell><MyAccountPage /></AppShell>} />
      <Route path="/profile/settings" element={<AppShell><SettingsPage /></AppShell>} />
      <Route path="/profile/language" element={<AppShell><LanguagePage /></AppShell>} />
      <Route path="/profile/notifications" element={<AppShell><NotificationsPage /></AppShell>} />
      <Route path="/profile/privacy" element={<AppShell><PrivacyPage /></AppShell>} />
      <Route path="/profile/help" element={<AppShell><HelpPage /></AppShell>} />

      <Route path="/states" element={<AppShell><StatesPreviewPage /></AppShell>} />

      <Route path="/profile/privacy/*" element={<ComingSoon label="Privacy sub-page" />} />

      {/* Marketing site */}
      <Route
        path="/*"
        element={
          <div className="page">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <OpenAppBanner />
            <Footer />
          </div>
        }
      />
    </Routes>
  );
}
