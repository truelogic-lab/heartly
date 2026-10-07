import { Outlet } from 'react-router-dom';
import BottomTabs from './BottomTabs.jsx';

export default function AppShell() {
  return (
    <div className="app-shell">
      <main className="app-shell__main">
        <Outlet />
      </main>
      <BottomTabs />
    </div>
  );
}
