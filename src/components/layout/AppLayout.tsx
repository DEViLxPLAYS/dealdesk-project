import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, MobileNavBar } from './Sidebar';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile top bar */}
      <MobileNavBar onMenuClick={() => setMobileOpen(true)} />

      {/* Main content */}
      <main className={`
        min-h-screen transition-all duration-300 ease-in-out
        lg:ml-${collapsed ? '[72px]' : '64'}
        pt-14 lg:pt-0
      `}
        style={{ marginLeft: undefined }}
      >
        <div
          className="min-h-screen transition-all duration-300"
          style={{ marginLeft: 0 }}
        >
          {/* Desktop margin handled via className on a wrapper */}
          <div className={`lg:transition-all lg:duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
