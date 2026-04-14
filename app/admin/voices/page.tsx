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
  Select,
  Segmented,
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
  source?: 'mine' | 'shared';
};

type LibrarySource = 'mine' | 'shared';

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

  // Library source + filter state (only relevant when viewing shared library).
  const [source, setSource] = useState<LibrarySource>('mine');
  const [filters, setFilters] = useState<{
    gender?: string;
    accent?: string;
    age?: string;
    language?: string;
    category?: string;
  }>({});

  // Local edits keyed by voice id, applied on top of the merged base row.
  const [edits, setEdits] = useState<Record<string, Partial<CuratedVoice>>>({});

  const buildLibraryUrl = () => {
    const qs = new URLSearchParams({ source });
    if (source === 'shared') {
      qs.set('pageSize', '60');
      if (search.trim()) qs.set('search', search.trim());
      if (filters.gender) qs.set('gender', filters.gender);
      if (filters.accent) qs.set('accent', filters.accent);
      if (filters.age) qs.set('age', filters.age);
      if (filters.language) qs.set('language', filters.language);
      if (filters.category) qs.set('category', filters.category);
    }
    return `/api/admin/voices/library?${qs.toString()}`;
  };

  const loadAll = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [libRes, curRes] = await Promise.all([
        fetch(buildLibraryUrl()),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  useEffect(() => {
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
    const libraryIds = new Set(library.map((l) => l.id));

    // Base rows: every voice in the current library tab (mine or shared).
    const base = library.map((lib) => {
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

    // Plus: any curated voices NOT present in the current library tab, so the
    // user always sees what they've saved even while filtering the shared
    // library for new ones. Shown as extras at the top of the list.
    const extras = (curated ?? [])
      .filter((c) => !libraryIds.has(c.id))
      .map((c) => {
        const edit = edits[c.id] ?? {};
        return {
          id: c.id,
          libraryName: c.label || c.id,
          libraryDescription: c.description || '',
          previewUrl: c.previewUrl || '',
          category: 'saved',
          labels: { saved: 'saved' },
          label: edit.label ?? c.label,
          description: edit.description ?? c.description ?? '',
          enabled: edit.enabled ?? c.enabled,
        };
      });

    return [...extras, ...base];
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
    // Only send the voices the user actually touched in this session. The
    // server upserts by id, so voices not in the payload stay as they were
    // — which is exactly what we want when browsing the shared library.
    const editedIds = Object.keys(edits);
    if (editedIds.length === 0) {
      antdMessage.info('No changes to save.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        voices: editedIds.map((id) => {
          const row = rows.find((r) => r.id === id);
          if (!row) return { id };
          return {
            id: row.id,
            label: row.label,
            description: row.description,
            previewUrl: row.previewUrl,
            enabled: row.enabled,
          };
        }),
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
      antdMessage.success(`Saved ${editedIds.length} change${editedIds.length === 1 ? '' : 's'}.`);
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

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <Segmented
              value={source}
              onChange={(v) => setSource(v as LibrarySource)}
              options={[
                { label: 'My Voices', value: 'mine' },
                { label: 'Voice Library (all)', value: 'shared' },
              ]}
            />
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={
                source === 'shared'
                  ? 'Search the full ElevenLabs library…'
                  : 'Filter your voices…'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => source === 'shared' && loadAll()}
              disabled={loading}
              style={{ maxWidth: 320, flex: 1, minWidth: 200 }}
            />
            {source === 'shared' && (
              <>
                <Select
                  allowClear
                  placeholder="Gender"
                  style={{ minWidth: 120 }}
                  value={filters.gender}
                  onChange={(v) => setFilters({ ...filters, gender: v })}
                  options={[
                    { value: 'female', label: 'Female' },
                    { value: 'male', label: 'Male' },
                    { value: 'neutral', label: 'Neutral' },
                  ]}
                />
                <Select
                  allowClear
                  placeholder="Language"
                  style={{ minWidth: 140 }}
                  value={filters.language}
                  onChange={(v) => setFilters({ ...filters, language: v })}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'hi', label: 'Hindi' },
                    { value: 'es', label: 'Spanish' },
                    { value: 'fr', label: 'French' },
                    { value: 'de', label: 'German' },
                    { value: 'it', label: 'Italian' },
                    { value: 'pt', label: 'Portuguese' },
                    { value: 'ja', label: 'Japanese' },
                    { value: 'zh', label: 'Chinese' },
                    { value: 'ar', label: 'Arabic' },
                  ]}
                />
                <Select
                  allowClear
                  placeholder="Accent"
                  style={{ minWidth: 140 }}
                  value={filters.accent}
                  onChange={(v) => setFilters({ ...filters, accent: v })}
                  options={[
                    { value: 'american', label: 'American' },
                    { value: 'british', label: 'British' },
                    { value: 'indian', label: 'Indian' },
                    { value: 'australian', label: 'Australian' },
                    { value: 'irish', label: 'Irish' },
                    { value: 'scottish', label: 'Scottish' },
                  ]}
                />
                <Select
                  allowClear
                  placeholder="Age"
                  style={{ minWidth: 120 }}
                  value={filters.age}
                  onChange={(v) => setFilters({ ...filters, age: v })}
                  options={[
                    { value: 'young', label: 'Young' },
                    { value: 'middle_aged', label: 'Middle aged' },
                    { value: 'old', label: 'Old' },
                  ]}
                />
                <Select
                  allowClear
                  placeholder="Use case"
                  style={{ minWidth: 160 }}
                  value={filters.category}
                  onChange={(v) => setFilters({ ...filters, category: v })}
                  options={[
                    { value: 'conversational', label: 'Conversational' },
                    { value: 'narrative_story', label: 'Narrative' },
                    { value: 'characters_animation', label: 'Characters' },
                    { value: 'news', label: 'News' },
                    { value: 'social_media', label: 'Social media' },
                  ]}
                />
                <Button onClick={loadAll} loading={loading}>
                  Apply filters
                </Button>
              </>
            )}
          </div>

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
