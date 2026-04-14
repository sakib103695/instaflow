'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Table, Card, Typography, Button, Space, Skeleton, Popconfirm, message, Tag, Tooltip } from 'antd';
import { PlayCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { APP_CONFIG } from '@/constants';

const { Title, Text } = Typography;

type ClientRow = {
  slug: string;
  name: string;
  domain: string;
  voiceId: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminClientsPage() {
  const [data, setData] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function load() {
    try {
      setLoading(true);
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setData(await res.json());
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(slug: string) {
    const res = await fetch(`/api/clients/${slug}`, { method: 'DELETE' });
    if (res.ok) {
      message.success('Client deleted');
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      message.error(err.error || 'Delete failed');
    }
  }

  async function handleSetDefault(slug: string) {
    const res = await fetch(`/api/clients/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    if (res.ok) {
      message.success('Default updated');
      load();
    } else {
      message.error('Failed to set default');
    }
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, row: ClientRow) => (
        <Space size={8}>
          <Link href={`/admin/clients/${row.slug}`} style={{ color: '#c4b5fd' }}>
            {name}
          </Link>
          {row.isDefault && (
            <Tooltip title="Loaded on the homepage when no ?client= query is set">
              <Tag color="gold">Default</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    { title: 'Domain', dataIndex: 'domain', key: 'domain' },
    {
      title: 'Agent',
      key: 'public',
      width: 190,
      render: (_: unknown, row: ClientRow) => {
        const url = `/?client=${row.slug}`;
        return (
          <Space size={4}>
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => window.open(url, '_blank')}
            >
              Try agent
            </Button>
            <Tooltip title="Copy URL for mail campaign">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  const absolute = typeof window !== 'undefined'
                    ? `${window.location.origin}${url}`
                    : url;
                  navigator.clipboard.writeText(absolute);
                  message.success('URL copied');
                }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    { title: 'Voice', dataIndex: 'voiceId', key: 'voiceId', width: 110 },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (v: string) => (v ? new Date(v).toLocaleString() : '—'),
    },
    {
      title: 'Action',
      key: 'action',
      width: 280,
      render: (_: unknown, row: ClientRow) => (
        <Space>
          <Button size="small" onClick={() => router.push(`/admin/clients/${row.slug}`)}>
            Edit
          </Button>
          {!row.isDefault && (
            <Button size="small" onClick={() => handleSetDefault(row.slug)}>
              Set default
            </Button>
          )}
          {row.isDefault ? (
            <Tooltip title="Promote another client to default before deleting this one">
              <Button size="small" danger disabled>
                Delete
              </Button>
            </Tooltip>
          ) : (
            <Popconfirm title="Delete this client?" onConfirm={() => handleDelete(row.slug)}>
              <Button size="small" danger>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
      <div style={{ minHeight: '100vh', padding: 32, background: APP_CONFIG.secondaryColor }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={3} style={{ marginBottom: 0, color: 'rgba(255,255,255,0.95)' }}>
                  Clients
                </Title>
                <Text type="secondary">Each client gets its own AI voice agent at /[slug].</Text>
              </div>
              <Button type="primary" onClick={() => router.push('/admin/clients/new')}>
                + New Client
              </Button>
            </div>
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <Table rowKey="slug" columns={columns} dataSource={data} pagination={{ pageSize: 20 }} />
            )}
          </Space>
        </Card>
      </div>
  );
}
