'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Typography,
  Space,
  Select,
  Button,
  Alert,
  Skeleton,
  Tag,
  Input,
  message as antdMessage,
} from 'antd';
import { SaveOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { APP_CONFIG } from '@/constants';

const { Title, Text, Paragraph } = Typography;

type OrModel = {
  id: string;
  name: string;
  promptPerM: number | null;
  completionPerM: number | null;
  contextLength: number | null;
};

function formatPrice(v: number | null): string {
  if (v == null) return '—';
  if (v === 0) return 'free';
  if (v < 0.01) return `$${v.toFixed(4)}`;
  if (v < 1) return `$${v.toFixed(3)}`;
  return `$${v.toFixed(2)}`;
}

function formatContext(v: number | null): string {
  if (!v) return '';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ctx`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k ctx`;
  return `${v} ctx`;
}

export default function AdminSettingsPage() {
  const [models, setModels] = useState<OrModel[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | undefined>();
  const [savedValue, setSavedValue] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [modelsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/openrouter/models'),
        fetch('/api/admin/settings'),
      ]);
      if (!modelsRes.ok) {
        const err = await modelsRes.json().catch(() => ({}));
        throw new Error(err.error || `Models fetch failed (${modelsRes.status})`);
      }
      const modelsJson = await modelsRes.json();
      const settingsJson = settingsRes.ok ? await settingsRes.json() : {};
      setModels(modelsJson.models || []);
      const current = settingsJson.openrouterModel || undefined;
      setSelected(current);
      setSavedValue(current);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openrouterModel: selected ?? '' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Save failed (${res.status})`);
      }
      setSavedValue(selected);
      antdMessage.success(selected ? 'Model saved.' : 'Cleared — will fall back to Gemini direct.');
    } catch (err) {
      antdMessage.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    if (!models) return [];
    const q = search.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));
  }, [models, search]);

  const selectedModel = models?.find((m) => m.id === selected);
  const hasUnsaved = selected !== savedValue;

  return (
    <div style={{ minHeight: '100vh', padding: 32, background: APP_CONFIG.secondaryColor }}>
      <Card
        variant="outlined"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          border: '1px solid rgba(91, 33, 182, 0.4)',
          boxShadow: '0 0 40px rgba(91, 33, 182, 0.12)',
        }}
        styles={{ body: { padding: 24 } }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3} style={{ marginBottom: 4, color: 'rgba(255,255,255,0.95)' }}>
              Settings
            </Title>
            <Text type="secondary">
              Runtime-tunable knobs. Changes take effect on the next site structuring call — no redeploy.
            </Text>
          </div>

          <div>
            <Title level={5} style={{ color: 'rgba(255,255,255,0.9)' }}>
              Site structuring model
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
              Which OpenRouter model analyzes a scraped website into the structured JSON the agent uses.
              Cheapest models are listed first. If you leave this empty, we fall back to Gemini 2.5 Pro
              via your direct <code>GEMINI_API_KEY</code>.
            </Paragraph>
          </div>

          {loadError && (
            <Alert
              type="error"
              showIcon
              message="Could not load OpenRouter catalog"
              description={loadError}
            />
          )}

          {loading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Search by model id or provider (e.g. gemini, deepseek, llama, free)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 520 }}
              />

              <Select
                showSearch
                allowClear
                value={selected}
                onChange={(v) => setSelected(v || undefined)}
                placeholder="Pick a model"
                style={{ width: '100%', maxWidth: 720 }}
                size="large"
                filterOption={(input, option) =>
                  String(option?.searchText || '').toLowerCase().includes(input.toLowerCase())
                }
                listHeight={480}
                options={filtered.map((m) => ({
                  value: m.id,
                  searchText: `${m.id} ${m.name}`,
                  label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ color: 'rgba(255,255,255,0.95)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {m.name}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{m.id}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                        <Tag color="purple" style={{ margin: 0 }}>
                          in {formatPrice(m.promptPerM)}/M
                        </Tag>
                        <Tag color="blue" style={{ margin: 0 }}>
                          out {formatPrice(m.completionPerM)}/M
                        </Tag>
                        {m.contextLength ? (
                          <Tag style={{ margin: 0 }}>{formatContext(m.contextLength)}</Tag>
                        ) : null}
                      </div>
                    </div>
                  ),
                }))}
              />

              {selectedModel && (
                <Alert
                  type="info"
                  showIcon
                  message={
                    <>
                      <strong>{selectedModel.name}</strong> · in {formatPrice(selectedModel.promptPerM)}/M ·
                      out {formatPrice(selectedModel.completionPerM)}/M ·{' '}
                      {formatContext(selectedModel.contextLength)}
                    </>
                  }
                  description={
                    <div>
                      Estimated cost at ~50k input / 2k output per client:{' '}
                      <strong>
                        {selectedModel.promptPerM != null && selectedModel.completionPerM != null
                          ? `$${(
                              (selectedModel.promptPerM * 50_000 +
                                selectedModel.completionPerM * 2_000) /
                              1_000_000
                            ).toFixed(4)}`
                          : 'unknown'}
                      </strong>{' '}
                      per client · 5,000 clients ≈{' '}
                      <strong>
                        {selectedModel.promptPerM != null && selectedModel.completionPerM != null
                          ? `$${(
                              (5_000 *
                                (selectedModel.promptPerM * 50_000 +
                                  selectedModel.completionPerM * 2_000)) /
                              1_000_000
                            ).toFixed(2)}`
                          : 'unknown'}
                      </strong>
                    </div>
                  }
                />
              )}

              <Space>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={save}
                  loading={saving}
                  disabled={!hasUnsaved}
                >
                  Save
                </Button>
                <Button icon={<ReloadOutlined />} onClick={loadAll} disabled={saving}>
                  Reload catalog
                </Button>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {models?.length ?? 0} models available
                </Text>
              </Space>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}
