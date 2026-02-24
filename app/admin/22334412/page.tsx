'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfigProvider, Table, Card, Typography, Tag, Space, Skeleton } from 'antd';
import type { ThemeConfig } from 'antd';
import { theme } from 'antd';
import { APP_CONFIG } from '@/constants';

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
    Table: {
      headerBg: '#251044',
      headerColor: 'rgba(255,255,255,0.9)',
    },
    Card: {
      colorBgContainer: '#1a0a2e',
    },
  },
};

type ConversationSummary = {
  id: string;
  startedAt: string | null;
  endedAt: string | null;
  voiceLabel: string | null;
  messageCount: number;
};

const { Title, Text } = Typography;

export default function AdminConversationsPage() {
  const [data, setData] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/conversations');
        if (!res.ok) {
          throw new Error(`Failed to load conversations (${res.status})`);
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns = [
    {
      title: 'SL',
      key: 'sl',
      width: 70,
      align: 'center' as const,
      render: (_: unknown, __: ConversationSummary, index: number) => index + 1,
    },
    {
      title: 'Started At',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (value: string | null) =>
        value ? new Date(value).toLocaleString() : <Text type="secondary">Unknown</Text>,
    },
    {
      title: 'Ended At',
      dataIndex: 'endedAt',
      key: 'endedAt',
      render: (value: string | null) =>
        value ? new Date(value).toLocaleString() : <Text type="secondary">In progress</Text>,
    },
    {
      title: 'Voice',
      dataIndex: 'voiceLabel',
      key: 'voiceLabel',
      render: (value: string | null) =>
        value ? (
          <Tag style={{ borderColor: APP_CONFIG.primaryColor, color: APP_CONFIG.primaryColor }}>
            {value}
          </Tag>
        ) : (
          <Text type="secondary">Unknown</Text>
        ),
    },
    {
      title: 'Messages',
      dataIndex: 'messageCount',
      key: 'messageCount',
      width: 120,
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: unknown, record: ConversationSummary) => (
        <a
          onClick={() => router.push(`/admin/22334412/${record.id}`)}
          style={{ color: APP_CONFIG.primaryColor, cursor: 'pointer' }}
        >
          View
        </a>
      ),
    },
  ];

  return (
    <ConfigProvider theme={ADMIN_THEME}>
      <div
        style={{
          minHeight: '100vh',
          padding: '32px',
          background: APP_CONFIG.secondaryColor,
        }}
      >
        <Card
          variant="outlined"
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            border: `1px solid rgba(91, 33, 182, 0.4)`,
            boxShadow: '0 0 40px rgba(91, 33, 182, 0.12)',
          }}
          styles={{ body: { padding: 24 } }}
        >
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={3} style={{ marginBottom: 0, color: 'rgba(255,255,255,0.95)' }}>
                InstaFlow Conversations
              </Title>
              <Text type="secondary">
                Internal admin view – only visitable via the secret URL.
              </Text>
            </div>

            {error && (
              <Text type="danger" style={{ display: 'block' }}>
                {error}
              </Text>
            )}

            {loading ? (
              <Skeleton active paragraph={{ rows: 8 }} title={{ width: '100%' }} />
            ) : (
              <Table
                rowKey="id"
                columns={columns}
                dataSource={data}
                pagination={{ pageSize: 10 }}
              />
            )}
          </Space>
        </Card>
      </div>
    </ConfigProvider>
  );
}
