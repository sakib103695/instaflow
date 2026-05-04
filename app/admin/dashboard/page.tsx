'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  Typography,
  Space,
  Statistic,
  Tag,
  Button,
  Alert,
  Skeleton,
  Tooltip,
  message as antdMessage,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
  MessageOutlined,
  SoundOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { APP_CONFIG } from '@/constants';

const { Title, Text } = Typography;

type Dashboard = {
  clients: { total: number; done: number; pending: number; inProgress: number; failed: number };
  defaultClient: { slug: string; name: string } | null;
  conversations: { total: number; last24h: number };
  voices: { enabled: number };
  recentClients: Array<{ slug: string; name: string; scrapeStatus: string; createdAt: string }>;
  recentFailures: Array<{ slug: string; name: string; scrapeError: string; updatedAt: string }>;
};

const STATUS_TAG: Record<string, { color: string; label: string }> = {
  done: { color: 'green', label: 'Ready' },
  pending: { color: 'gold', label: 'Pending' },
  in_progress: { color: 'blue', label: 'Scraping' },
  failed: { color: 'red', label: 'Failed' },
};

function panelStyle() {
  return {
    background: 'rgba(91,33,182,0.08)',
    border: '1px solid rgba(91,33,182,0.35)',
  } as const;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const stopRef = useRef(false);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Dashboard failed (${res.status})`);
      setData(await res.json());
    } catch (err) {
      console.error(err);
      antdMessage.error(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Refresh every 8s while the page is open so progress is visible.
    const id = setInterval(load, 8_000);
    return () => clearInterval(id);
  }, []);

  const startScraping = async () => {
    if (scraping) return;
    setScraping(true);
    stopRef.current = false;
    try {
      while (!stopRef.current) {
        const res = await fetch('/api/clients/scrape-pending', { method: 'POST' });
        if (!res.ok) {
          antdMessage.error('Scrape worker error — paused.');
          break;
        }
        const json = await res.json();
        await load();
        if (json.processed === 0) {
          antdMessage.success('All pending clients processed.');
          break;
        }
      }
    } finally {
      setScraping(false);
    }
  };
  const stopScraping = () => {
    stopRef.current = true;
  };

  if (loading && !data) {
    return (
      <div style={{ minHeight: '100vh', padding: 32, background: APP_CONFIG.secondaryColor }}>
        <Card style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    );
  }
  if (!data) return null;

  const { clients, conversations, voices, defaultClient, recentClients, recentFailures } = data;
  const queueActive = clients.pending + clients.inProgress > 0;

  return (
    <div style={{ minHeight: '100vh', padding: 32, background: APP_CONFIG.secondaryColor }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={3} style={{ marginBottom: 0, color: 'rgba(255,255,255,0.95)' }}>
              Dashboard
            </Title>
            <Text type="secondary">Overview of every client, the scrape queue, and recent activity.</Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
          </Space>
        </div>

        {/* Top stat cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Card size="small" style={panelStyle()}>
            <Statistic
              title={<Space size={6}><TeamOutlined /> Clients</Space>}
              value={clients.total}
              valueStyle={{ color: 'rgba(255,255,255,0.95)' }}
            />
            <div style={{ marginTop: 6, fontSize: 12 }}>
              <Tag color="green">{clients.done} ready</Tag>
              {clients.pending > 0 && <Tag color="gold">{clients.pending} pending</Tag>}
              {clients.inProgress > 0 && <Tag color="blue">{clients.inProgress} scraping</Tag>}
              {clients.failed > 0 && <Tag color="red">{clients.failed} failed</Tag>}
            </div>
          </Card>
          <Card size="small" style={panelStyle()}>
            <Statistic
              title={<Space size={6}><MessageOutlined /> Conversations</Space>}
              value={conversations.total}
              valueStyle={{ color: 'rgba(255,255,255,0.95)' }}
            />
            <div style={{ marginTop: 6, fontSize: 12 }}>
              <Tag>{conversations.last24h} in last 24h</Tag>
            </div>
          </Card>
          <Card size="small" style={panelStyle()}>
            <Statistic
              title={<Space size={6}><SoundOutlined /> Voices enabled</Space>}
              value={voices.enabled}
              valueStyle={{ color: 'rgba(255,255,255,0.95)' }}
            />
            <div style={{ marginTop: 6, fontSize: 12 }}>
              <Link href="/admin/voices" style={{ color: '#c4b5fd' }}>Manage voices →</Link>
            </div>
          </Card>
          <Card size="small" style={panelStyle()}>
            <Statistic
              title="Default client"
              value={defaultClient?.name || '—'}
              valueStyle={{ color: 'rgba(255,255,255,0.95)', fontSize: 18 }}
            />
            {defaultClient && (
              <div style={{ marginTop: 6, fontSize: 12 }}>
                <Link href={`/admin/clients/${defaultClient.slug}`} style={{ color: '#c4b5fd' }}>
                  Edit →
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Scrape queue panel */}
        <Card
          title={
            <Space>
              <span style={{ color: 'rgba(255,255,255,0.92)' }}>Scrape queue</span>
              {queueActive && <Tag color={scraping ? 'blue' : 'gold'}>{scraping ? 'Running' : 'Idle'}</Tag>}
              {!queueActive && <Tag color="green" icon={<CheckCircleOutlined />}>All caught up</Tag>}
            </Space>
          }
          style={{ marginBottom: 24, ...panelStyle() }}
          extra={
            queueActive ? (
              scraping ? (
                <Button icon={<PauseCircleOutlined />} onClick={stopScraping}>
                  Pause
                </Button>
              ) : (
                <Button type="primary" icon={<PlayCircleOutlined />} onClick={startScraping}>
                  Scrape {clients.pending + clients.inProgress} now
                </Button>
              )
            ) : null
          }
        >
          {queueActive ? (
            <Text type="secondary">
              {clients.pending} pending · {clients.inProgress} scraping · {clients.failed} failed.
              Each client takes ~10–60 seconds. You can leave the page; scraping will continue
              if you click <strong>Bulk Upload</strong> there too.
            </Text>
          ) : (
            <Text type="secondary">
              No pending or in-progress scrapes. Add clients via{' '}
              <Link href="/admin/clients/new" style={{ color: '#c4b5fd' }}>New client</Link> or{' '}
              <Link href="/admin/clients/bulk" style={{ color: '#c4b5fd' }}>Bulk upload</Link>.
            </Text>
          )}
        </Card>

        {/* Recent failures (only shown if any) */}
        {recentFailures.length > 0 && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 24 }}
            message={`${recentFailures.length} recent scrape failure${recentFailures.length === 1 ? '' : 's'}`}
            description={
              <div>
                {recentFailures.map((f) => (
                  <div key={f.slug} style={{ marginBottom: 4 }}>
                    <Link href={`/admin/clients/${f.slug}`} style={{ color: '#c4b5fd' }}>
                      {f.name}
                    </Link>{' '}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {f.scrapeError || 'unknown error'}
                    </Text>
                  </div>
                ))}
                <div style={{ marginTop: 6 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Open each client and click <strong>Re-scrape</strong>, or use{' '}
                    <strong>Paste manual content</strong> if the site blocks scraping.
                  </Text>
                </div>
              </div>
            }
          />
        )}

        {/* Recent activity */}
        <Card title="Recently added clients" style={panelStyle()}>
          {recentClients.length === 0 ? (
            <Text type="secondary">No clients yet.</Text>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {recentClients.map((c) => {
                const meta = STATUS_TAG[c.scrapeStatus] ?? STATUS_TAG.done;
                return (
                  <div
                    key={c.slug}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 4px',
                      borderBottom: '1px solid rgba(91,33,182,0.15)',
                    }}
                  >
                    <Link href={`/admin/clients/${c.slug}`} style={{ color: '#c4b5fd' }}>
                      {c.name}
                    </Link>
                    <Space size={8}>
                      <Tag color={meta.color} style={{ margin: 0 }}>{meta.label}</Tag>
                      <Tooltip title={c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                        </Text>
                      </Tooltip>
                      <Button
                        size="small"
                        onClick={() => window.open(`/?client=${c.slug}`, '_blank')}
                        disabled={c.scrapeStatus !== 'done'}
                      >
                        Try
                      </Button>
                    </Space>
                  </div>
                );
              })}
              <div style={{ marginTop: 4 }}>
                <Link href="/admin/clients" style={{ color: '#c4b5fd' }}>
                  See all {clients.total} →
                </Link>
              </div>
            </Space>
          )}
        </Card>
      </div>
    </div>
  );
}
