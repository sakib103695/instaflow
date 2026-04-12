'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ConfigProvider, Layout, Menu, theme } from 'antd';
import type { ThemeConfig } from 'antd';
import {
  TeamOutlined,
  MessageOutlined,
  SoundOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  UploadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { APP_CONFIG } from '@/constants';

const { Sider, Content } = Layout;
const { darkAlgorithm } = theme;

const ADMIN_THEME: ThemeConfig = {
  algorithm: darkAlgorithm,
  token: {
    colorPrimary: '#a78bfa',
    colorBgContainer: '#1a0a2e',
    colorBgElevated: '#251044',
    colorBorder: 'rgba(139, 92, 246, 0.30)',
    colorText: 'rgba(255,255,255,0.92)',
    colorTextSecondary: 'rgba(255,255,255,0.65)',
    colorLink: '#c4b5fd',
    colorLinkHover: '#ddd6fe',
    colorLinkActive: '#a78bfa',
  },
  components: {
    Menu: {
      darkItemBg: '#0f0518',
      darkSubMenuItemBg: '#0f0518',
      darkItemSelectedBg: '#7c3aed',
      darkItemHoverBg: 'rgba(124, 58, 237, 0.20)',
    },
    Table: {
      headerBg: '#251044',
      headerColor: 'rgba(255,255,255,0.92)',
    },
    Card: {
      colorBgContainer: '#1a0a2e',
    },
  },
};

type NavItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: { key: string; icon?: React.ReactNode; label: string }[];
};

const NAV_ITEMS: NavItem[] = [
  {
    key: 'group:clients',
    icon: <TeamOutlined />,
    label: 'Clients',
    children: [
      { key: '/admin/clients', icon: <UnorderedListOutlined />, label: 'All Clients' },
      { key: '/admin/clients/new', icon: <PlusOutlined />, label: 'Add New' },
      { key: '/admin/clients/bulk', icon: <UploadOutlined />, label: 'Bulk Upload' },
    ],
  },
  { key: '/admin/22334412', icon: <MessageOutlined />, label: 'Conversations' },
  { key: '/admin/voices', icon: <SoundOutlined />, label: 'Voices' },
  { key: '/admin/settings', icon: <SettingOutlined />, label: 'Settings' },
];

/** Flatten NAV_ITEMS into the shape Ant's Menu wants. */
const MENU_ITEMS = NAV_ITEMS.map((item) =>
  item.children
    ? { key: item.key, icon: item.icon, label: item.label, children: item.children }
    : { key: item.key, icon: item.icon, label: item.label },
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [collapsed, setCollapsed] = useState(false);

  // Flatten leaves only — group keys ("group:*") never match a URL.
  const leafKeys = NAV_ITEMS.flatMap((item) =>
    item.children ? item.children.map((c) => c.key) : [item.key],
  );
  const selectedKey =
    leafKeys
      .filter((k) => pathname === k || pathname.startsWith(k + '/'))
      .sort((a, b) => b.length - a.length)[0] ?? '/admin/clients';
  const openKeys = NAV_ITEMS.filter((i) =>
    i.children?.some((c) => pathname === c.key || pathname.startsWith(c.key + '/')),
  ).map((i) => i.key);

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
            defaultOpenKeys={openKeys}
            items={MENU_ITEMS}
            onClick={({ key }) => router.push(key)}
            style={{ background: '#0f0518', borderRight: 0 }}
          />
        </Sider>
        <Content style={{ background: APP_CONFIG.secondaryColor }}>{children}</Content>
      </Layout>
    </ConfigProvider>
  );
}
