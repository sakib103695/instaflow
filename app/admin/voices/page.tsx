'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Card,
  Typography,
  Input,
  Button,
  Switch,
  Space,
  Skeleton,
  Tag,
  Table,
  message as antdMessage,
  Alert,
} from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, SaveOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { APP_CONFIG } from '@/constants';

const { Title, Text } = Typography;

type LibraryVoice = {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  category: string;
  labels: Record<string, string>;
};

type CuratedVoice = {
  id: string;
  label: string;
  description: string;
  previewUrl: string;
  enabled: boolean;
};

/**
 * Merge the ElevenLabs library with the curated list saved in Mongo.
 *
 * The library is the source of truth for *which* voices exist + previewUrl;
 * the curated list overlays our edits (custom label, custom description,
 * enabled flag).
 */
type Row = {
  id: string;
  libraryName: string;
  libraryDescription: string;
  previewUrl: string;
  category: string;
  labels: Record<string, string>;
  // Editable overlay
  label: string;
  description: string;
  enabled: boolean;
};

export default function AdminVoicesPage() {
  const [library, setLibrary] = useState<LibraryVoice[] | null>(null);
  const [curated, setCurated] = useState<CuratedVoice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Local edits keyed by voice id, applied on top of the merged base row.
  const [edits, setEdits] = useState<Record<string, Partial<CuratedVoice>>>({});

  const loadAll = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [libRes, curRes] = await Promise.all([
        fetch('/api/admin/voices/library'),
        fetch('/api/admin/voices'),
      ]);
      if (!libRes.ok) {
        const err = await libRes.json().catch(() => ({}));
        throw new Error(err.error || `Library fetch failed (${libRes.status})`);
      }
      const libJson = await libRes.json();
      const curJson = curRes.ok ? await curRes.json() : [];
      setLibrary(libJson.voices || []);
      setCurated(curJson || []);
      setEdits({});
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load voices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const rows: Row[] = useMemo(() => {
    if (!library) return [];
    const curatedById = new Map((curated ?? []).map((c) => [c.id, c]));
    return library.map((lib) => {
      const c = curatedById.get(lib.id);
      const edit = edits[lib.id] ?? {};
      return {
        id: lib.id,
        libraryName: lib.name,
        libraryDescription: lib.description || '',
        previewUrl: lib.previewUrl,
        category: lib.category,
        labels: lib.labels || {},
        label: edit.label ?? c?.label ?? lib.name,
        description: edit.description ?? c?.description ?? lib.description ?? '',
        enabled: edit.enabled ?? c?.enabled ?? false,
      };
    });
  }, [library, curated, edits]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.libraryName.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        Object.values(r.labels).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const enabledCount = rows.filter((r) => r.enabled).length;

  const playPreview = (row: Row) => {
    if (!row.previewUrl) {
      antdMessage.warning('No preview audio available for this voice.');
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingId === row.id) {
      setPlayingId(null);
      return;
    }
    const audio = new Audio(row.previewUrl);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      antdMessage.error('Failed to play preview.');
      setPlayingId(null);
    };
    audioRef.current = audio;
    setPlayingId(row.id);
    audio.play().catch(() => {
      setPlayingId(null);
      antdMessage.error('Browser blocked autoplay — click play again.');
    });
  };

  const updateRow = (id: string, patch: Partial<CuratedVoice>) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        voices: rows.map((r) => ({
          id: r.id,
          label: r.label,
          description: r.description,
          previewUrl: r.previewUrl,
          enabled: r.enabled,
        })),
      };
      const res = await fetch('/api/admin/voices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Save failed (${res.status})`);
      }
      antdMessage.success(`Saved. ${enabledCount} voice${enabledCount === 1 ? '' : 's'} enabled.`);
      setEdits({});
      // Refresh curated state from server.
      const curRes = await fetch('/api/admin/voices');
      if (curRes.ok) setCurated(await curRes.json());
    } catch (err) {
      antdMessage.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsaved = Object.keys(edits).length > 0;

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <Title level={3} style={{ marginBottom: 0, color: 'rgba(255,255,255,0.95)' }}>
                Voices
              </Title>
              <Text type="secondary">
                ElevenLabs voice library. Preview each one, edit its public name + description, and toggle which appear in the customer-facing picker.
              </Text>
            </div>
            <Space>
              <Tag color="purple">{enabledCount} enabled</Tag>
              <Button icon={<ReloadOutlined />} onClick={loadAll} disabled={loading || saving}>
                Reload
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={save}
                loading={saving}
                disabled={!hasUnsaved || loading}
              >
                Save changes
              </Button>
            </Space>
          </div>

          {loadError && (
            <Alert
              type="error"
              showIcon
              message="Could not load voice library"
              description={
                <>
                  {loadError}
                  {loadError.toLowerCase().includes('elevenlabs_api_key') && (
                    <div style={{ marginTop: 8 }}>
                      Set the <code>ELEVENLABS_API_KEY</code> GitHub secret then re-run the deploy workflow.
                    </div>
                  )}
                </>
              }
            />
          )}

          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search by name, description, accent, gender…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
            style={{ maxWidth: 480 }}
          />

          {loading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : (
            <Table
              rowKey="id"
              dataSource={filteredRows}
              pagination={{ pageSize: 12, size: 'small' }}
              size="middle"
              columns={[
                {
                  title: 'Voice',
                  key: 'name',
                  width: 220,
                  render: (_, row: Row) => (
                    <div>
                      <Text strong style={{ color: 'rgba(255,255,255,0.95)' }}>
                        {row.libraryName}
                      </Text>
                      {Object.keys(row.labels).length > 0 && (
                        <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {Object.entries(row.labels).slice(0, 3).map(([k, v]) => (
                            <Tag key={k} style={{ fontSize: 10, margin: 0, lineHeight: '16px' }}>
                              {String(v)}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  title: 'Preview',
                  key: 'preview',
                  width: 120,
                  align: 'center' as const,
                  render: (_, row: Row) => {
                    const isPlaying = playingId === row.id;
                    return (
                      <Button
                        size="small"
                        type={isPlaying ? 'primary' : 'default'}
                        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        onClick={() => playPreview(row)}
                        disabled={!row.previewUrl}
                      >
                        {isPlaying ? 'Stop' : 'Play'}
                      </Button>
                    );
                  },
                },
                {
                  title: 'Display label',
                  key: 'label',
                  width: 200,
                  render: (_, row: Row) => (
                    <Input
                      size="small"
                      value={row.label}
                      onChange={(e) => updateRow(row.id, { label: e.target.value })}
                      placeholder={row.libraryName}
                    />
                  ),
                },
                {
                  title: 'Description',
                  key: 'description',
                  render: (_, row: Row) => (
                    <Input
                      size="small"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, { description: e.target.value })}
                      placeholder="Shown in the public voice picker"
                    />
                  ),
                },
                {
                  title: 'Enabled',
                  key: 'enabled',
                  width: 80,
                  align: 'center' as const,
                  render: (_, row: Row) => (
                    <Switch
                      checked={row.enabled}
                      onChange={(checked) => updateRow(row.id, { enabled: checked })}
                      size="small"
                    />
                  ),
                },
              ]}
            />
          )}

          {!loading && !loadError && filteredRows.length === 0 && (
            <Text type="secondary">No voices match your search.</Text>
          )}
        </Space>
      </Card>
    </div>
  );
}
