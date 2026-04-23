import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, MobileNavBar } from './Sidebar';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile top bar */}
      <MobileNavBar onMenuClick={() => setMobileOpen(true)} />

      {/* Main content — single margin offset, never doubled */}
      <main
        className="min-h-screen transition-all duration-300 ease-in-out pt-14 lg:pt-0"
        style={{ marginLeft: 0 }}
      >
        <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
