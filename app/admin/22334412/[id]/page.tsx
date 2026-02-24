'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ConfigProvider, Card, Typography, Tag, Space, Skeleton } from 'antd';
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
    Card: { colorBgContainer: '#1a0a2e' },
  },
};

type TranscriptEntry = { role: 'user' | 'agent'; text: string };

type ConversationDetail = {
  id: string;
  transcript: (TranscriptEntry | string)[];
  selectedVoice: { label?: string } | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string | null;
  meta: Record<string, unknown>;
};

const { Title, Text } = Typography;

export default function AdminConversationDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [data, setData] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/conversations/${id}`);
        if (!res.ok) {
          throw new Error(`Failed to load conversation (${res.status})`);
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleString() : 'Unknown';

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
            maxWidth: 900,
            margin: '0 auto',
            border: `1px solid rgba(91, 33, 182, 0.4)`,
            boxShadow: '0 0 40px rgba(91, 33, 182, 0.12)',
          }}
          styles={{ body: { padding: 24 } }}
        >
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={3} style={{ marginBottom: 0, color: 'rgba(255,255,255,0.95)' }}>
                Conversation Detail
              </Title>
              <Text type="secondary">
                <Link
                  href="/admin/22334412"
                  style={{ color: APP_CONFIG.primaryColor }}
                >
                  ← Back to list
                </Link>
              </Text>
            </div>

            {error && (
              <Text type="danger" style={{ display: 'block' }}>
                {error}
              </Text>
            )}

            {loading && !data && (
              <>
                <Skeleton active title={false} paragraph={{ rows: 5, width: ['100%', '80%', '60%', '90%', '70%'] }} style={{ marginTop: 8 }} />
                <Skeleton active title={{ width: 120 }} paragraph={{ rows: 6 }} style={{ marginTop: 24 }} />
              </>
            )}

            {data && (
              <>
                <Space orientation="vertical" size="small">
                  <Text>
                    <strong>ID:</strong> {data.id}
                  </Text>
                  <Text>
                    <strong>Voice:</strong>{' '}
                    {data.selectedVoice?.label ? (
                      <Tag
                        style={{
                          borderColor: APP_CONFIG.primaryColor,
                          color: APP_CONFIG.primaryColor,
                        }}
                      >
                        {data.selectedVoice.label}
                      </Tag>
                    ) : (
                      <Text type="secondary">Unknown</Text>
                    )}
                  </Text>
                  <Text>
                    <strong>Started:</strong> {formatDate(data.startedAt)}
                  </Text>
                  <Text>
                    <strong>Ended:</strong> {formatDate(data.endedAt)}
                  </Text>
                  <Text>
                    <strong>Created:</strong> {formatDate(data.createdAt)}
                  </Text>
                </Space>

                <div>
                  <Title level={4} style={{ marginBottom: 12, color: 'rgba(255,255,255,0.95)' }}>
                    Transcript
                  </Title>
                  {(!data.transcript || data.transcript.length === 0) && (
                    <Text type="secondary">No transcript entries saved.</Text>
                  )}
                  {data.transcript && data.transcript.length > 0 && (
                    <div style={{ maxHeight: 480, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {data.transcript.map((entry, index) => {
                        const role = typeof entry === 'string' ? 'agent' : entry.role;
                        const text = typeof entry === 'string' ? entry : entry.text;
                        const isUser = role === 'user';
                        return (
                          <div
                            key={index}
                            style={{
                              alignSelf: isUser ? 'flex-end' : 'flex-start',
                              maxWidth: '85%',
                              padding: '12px 16px',
                              borderRadius: 12,
                              background: isUser ? 'rgba(255,255,255,0.08)' : 'rgba(91, 33, 182, 0.25)',
                              border: `1px solid ${isUser ? 'rgba(255,255,255,0.12)' : 'rgba(91, 33, 182, 0.4)'}`,
                            }}
                          >
                            <Text strong style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>
                              {isUser ? 'User' : (data.selectedVoice?.label ?? 'Agent')}
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.9)' }}>{text}</Text>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </Space>
        </Card>
      </div>
    </ConfigProvider>
  );
}
