'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ConfigProvider, Layout, Menu, theme } from 'antd';
import type { ThemeConfig } from 'antd';
import { TeamOutlined, MessageOutlined, SoundOutlined } from '@ant-design/icons';
import { APP_CONFIG } from '@/constants';

const { Sider, Content } = Layout;
const { darkAlgorithm } = theme;

const ADMIN_THEME: ThemeConfig = {
  algorithm: darkAlgorithm,
  token: {
    colorPrimary: APP_CONFIG.primaryColor,
    colorBgContainer: '#1a0a2e',
    colorBgElevated: '#251044',
    colorBorder: 'rgba(91, 33, 182, 0.35)',
    colorText: 'rgba(255,255,255,0.9)',
    colorTextSecondary: 'rgba(255,255,255,0.6)',
  },
  components: {
    Menu: {
      darkItemBg: '#0f0518',
      darkSubMenuItemBg: '#0f0518',
      darkItemSelectedBg: APP_CONFIG.primaryColor,
      darkItemHoverBg: 'rgba(91, 33, 182, 0.25)',
    },
  },
};

const NAV_ITEMS = [
  { key: '/admin/clients', icon: <TeamOutlined />, label: 'Clients' },
  { key: '/admin/22334412', icon: <MessageOutlined />, label: 'Conversations' },
  { key: '/admin/voices', icon: <SoundOutlined />, label: 'Voices' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [collapsed, setCollapsed] = useState(false);

  // Highlight the parent nav item even when on a nested route like
  // /admin/clients/new or /admin/22334412/abc123.
  const selectedKey =
    NAV_ITEMS.find((item) => pathname === item.key || pathname.startsWith(item.key + '/'))
      ?.key ?? '/admin/clients';

  return (
    <ConfigProvider theme={ADMIN_THEME}>
      <Layout style={{ minHeight: '100vh', background: APP_CONFIG.secondaryColor }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="dark"
          width={220}
          style={{
            background: '#0f0518',
            borderRight: '1px solid rgba(91, 33, 182, 0.25)',
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid rgba(91, 33, 182, 0.25)',
              color: 'rgba(255,255,255,0.95)',
              fontWeight: 700,
              fontSize: collapsed ? 14 : 18,
              letterSpacing: 1,
            }}
          >
            {collapsed ? 'IF' : APP_CONFIG.name}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={NAV_ITEMS}
            onClick={({ key }) => router.push(key)}
            style={{ background: '#0f0518', borderRight: 0 }}
          />
        </Sider>
        <Content style={{ background: APP_CONFIG.secondaryColor }}>{children}</Content>
      </Layout>
    </ConfigProvider>
  );
}
