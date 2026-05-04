'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Table, Card, Typography, Button, Space, Skeleton, Popconfirm, message, Tag, Tooltip } from 'antd';
import { PlayCircleOutlined, CopyOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
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
  scrapeStatus: 'pending' | 'in_progress' | 'done' | 'failed';
  scrapeError?: string;
  scrapedAt?: string | null;
  pagesScraped?: number;
};

const STATUS_META: Record<string, { color: string; label: string }> = {
  done: { color: 'green', label: 'Ready' },
  pending: { color: 'gold', label: 'Pending scrape' },
  in_progress: { color: 'blue', label: 'Scraping…' },
  failed: { color: 'red', label: 'Scrape failed' },
};

export default function AdminClientsPage() {
  const [data, setData] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkScraping, setBulkScraping] = useState(false);
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

  /**
   * Run a polling scrape loop just like the bulk page / dashboard so
   * the user gets live progress + per-row error toasts after triggering
   * a re-scrape on selected rows.
   */
  async function runScrapeLoop() {
    setBulkScraping(true);
    let consecutiveFailures = 0;
    try {
      while (true) {
        const res = await fetch('/api/clients/scrape-pending', { method: 'POST' });
        if (!res.ok) {
          message.error('Scrape worker unreachable — paused.');
          break;
        }
        const json = await res.json();
        await load();
        if (json.processed === 0) {
          message.success('All pending clients processed.');
          break;
        }
        if (json.status === 'failed') {
          consecutiveFailures += 1;
          message.error({
            content: `${json.name}: ${json.error || 'scrape failed'}`,
            duration: 8,
          });
          if (consecutiveFailures >= 3) {
            message.warning({
              content:
                '3 in a row failed. Paused — likely a missing API key in /admin/settings.',
              duration: 10,
            });
            break;
          }
        } else {
          consecutiveFailures = 0;
        }
      }
    } finally {
      setBulkScraping(false);
    }
  }

  async function bulkRescrape() {
    if (selectedKeys.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await fetch('/api/clients/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: selectedKeys, action: 'rescrape' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      message.success(`Re-queued ${json.requeued} client${json.requeued === 1 ? '' : 's'}. Scraping…`);
      setSelectedKeys([]);
      await load();
      await runScrapeLoop();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Re-scrape failed');
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkDelete() {
    if (selectedKeys.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await fetch('/api/clients/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: selectedKeys, action: 'delete' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      message.success(`Deleted ${json.deleted} client${json.deleted === 1 ? '' : 's'}.`);
      setSelectedKeys([]);
      await load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBulkBusy(false);
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
      title: 'Status',
      key: 'scrapeStatus',
      width: 150,
      render: (_: unknown, row: ClientRow) => {
        const meta = STATUS_META[row.scrapeStatus] ?? STATUS_META.done;
        const tag = <Tag color={meta.color} style={{ margin: 0 }}>{meta.label}</Tag>;
        if (row.scrapeStatus === 'failed' && row.scrapeError) {
          return <Tooltip title={row.scrapeError}>{tag}</Tooltip>;
        }
        return tag;
      },
    },
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
              <>
                {selectedKeys.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '10px 14px',
                      background: 'rgba(124, 58, 237, 0.15)',
                      border: '1px solid rgba(124, 58, 237, 0.45)',
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {selectedKeys.length} selected
                    </Text>
                    <Space wrap>
                      <Button
                        icon={<ReloadOutlined />}
                        loading={bulkBusy || bulkScraping}
                        onClick={bulkRescrape}
                      >
                        Re-scrape selected
                      </Button>
                      <Popconfirm
                        title={`Delete ${selectedKeys.length} client${selectedKeys.length === 1 ? '' : 's'}?`}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        onConfirm={bulkDelete}
                      >
                        <Button danger icon={<DeleteOutlined />} loading={bulkBusy}>
                          Delete selected
                        </Button>
                      </Popconfirm>
                      <Button onClick={() => setSelectedKeys([])}>Clear</Button>
                    </Space>
                  </div>
                )}
                <Table
                  rowKey="slug"
                  columns={columns}
                  dataSource={data}
                  pagination={{ pageSize: 20 }}
                  rowSelection={{
                    selectedRowKeys: selectedKeys,
                    onChange: setSelectedKeys,
                    // Quick "select only failed" preset — exactly the use
                    // case the user described: re-scrape just the failures
                    // without picking through the table by hand.
                    selections: [
                      {
                        key: 'failed',
                        text: 'Select failed only',
                        onSelect: () => {
                          setSelectedKeys(
                            data.filter((d) => d.scrapeStatus === 'failed').map((d) => d.slug),
                          );
                        },
                      },
                      {
                        key: 'pending',
                        text: 'Select pending + failed',
                        onSelect: () => {
                          setSelectedKeys(
                            data
                              .filter((d) => d.scrapeStatus === 'pending' || d.scrapeStatus === 'failed')
                              .map((d) => d.slug),
                          );
                        },
                      },
                      Table.SELECTION_ALL,
                      Table.SELECTION_INVERT,
                      Table.SELECTION_NONE,
                    ],
                  }}
                />
              </>
            )}
          </Space>
        </Card>
      </div>
  );
}
