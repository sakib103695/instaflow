'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Card, Typography, Tag, Space, Skeleton, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { APP_CONFIG } from '@/constants';

type ConversationSummary = {
  id: string;
  startedAt: string | null;
  endedAt: string | null;
  voiceLabel: string | null;
  messageCount: number;
  clientSlug: string | null;
  clientName: string | null;
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
      title: '#',
      key: 'sl',
      width: 50,
      align: 'center' as const,
      render: (_: unknown, __: ConversationSummary, index: number) => index + 1,
    },
    {
      title: 'Client',
      key: 'client',
      width: 160,
      render: (_: unknown, record: ConversationSummary) =>
        record.clientName ? (
          <a
            onClick={() => router.push(`/admin/clients/${record.clientSlug}`)}
            style={{ color: '#c4b5fd', cursor: 'pointer' }}
          >
            {record.clientName}
          </a>
        ) : (
          <Text type="secondary">Demo</Text>
        ),
    },
    {
      title: 'Started',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 170,
      render: (value: string | null) =>
        value ? new Date(value).toLocaleString() : <Text type="secondary">Unknown</Text>,
    },
    {
      title: 'Ended',
      dataIndex: 'endedAt',
      key: 'endedAt',
      width: 170,
      render: (value: string | null) =>
        value ? new Date(value).toLocaleString() : <Text type="secondary">In progress</Text>,
    },
    {
      title: 'Voice',
      dataIndex: 'voiceLabel',
      key: 'voiceLabel',
      width: 120,
      render: (value: string | null) =>
        value ? (
          <Tag style={{ borderColor: '#c4b5fd', color: '#c4b5fd' }}>
            {value}
          </Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Msgs',
      dataIndex: 'messageCount',
      key: 'messageCount',
      width: 70,
      align: 'center' as const,
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_: unknown, record: ConversationSummary) => (
        <a
          onClick={() => router.push(`/admin/22334412/${record.id}`)}
          style={{ color: '#c4b5fd', cursor: 'pointer' }}
        >
          View
        </a>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 32,
        background: APP_CONFIG.secondaryColor,
      }}
    >
      <Card
        variant="outlined"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          border: '1px solid rgba(91, 33, 182, 0.4)',
          boxShadow: '0 0 40px rgba(91, 33, 182, 0.12)',
        }}
        styles={{ body: { padding: 24 } }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <Title level={3} style={{ marginBottom: 0, color: 'rgba(255,255,255,0.95)' }}>
                Conversations
              </Title>
              <Text type="secondary">
                Call transcripts from all clients.
              </Text>
            </div>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => { window.location.href = '/api/conversations/export'; }}
            >
              Export .xlsx
            </Button>
          </div>

          {error && (
            <Text type="danger" style={{ display: 'block' }}>
              {error}
            </Text>
          )}

          {loading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={data}
              pagination={{ pageSize: 15 }}
              size="middle"
            />
          )}
        </Space>
      </Card>
    </div>
  );
}
