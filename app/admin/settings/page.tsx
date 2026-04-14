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
  Divider,
  message as antdMessage,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  SearchOutlined,
  EditOutlined,
  CheckCircleTwoTone,
  ExclamationCircleTwoTone,
} from '@ant-design/icons';
import { APP_CONFIG } from '@/constants';

const { Title, Text, Paragraph } = Typography;

type OrModel = {
  id: string;
  name: string;
  promptPerM: number | null;
  completionPerM: number | null;
  contextLength: number | null;
};

type SecretState = { configured: boolean; masked: string };

type SettingsDoc = {
  openrouterModel?: string | null;
  openrouterApiKey?: SecretState;
  elevenlabsApiKey?: SecretState;
  geminiApiKey?: SecretState;
  basePrompt?: string | null;
  structuringPrompt?: string | null;
};

type PromptDefaults = {
  basePrompt: string;
  structuringPrompt: string;
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

/**
 * Inline editor for a single secret. Shows the masked existing value by
 * default; click Edit to replace. Save sends the new plaintext once and
 * the server re-masks on the next GET.
 */
function SecretField({
  label,
  help,
  state,
  onSave,
}: {
  label: string;
  help?: React.ReactNode;
  state?: SecretState;
  onSave: (newValue: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const configured = !!state?.configured;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
      setDraft('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {configured ? (
          <CheckCircleTwoTone twoToneColor="#52c41a" />
        ) : (
          <ExclamationCircleTwoTone twoToneColor="#faad14" />
        )}
        <Text strong style={{ color: 'rgba(255,255,255,0.92)' }}>
          {label}
        </Text>
        {configured && !editing && (
          <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {state?.masked}
          </Text>
        )}
        {!configured && !editing && <Tag color="orange">not set</Tag>}
      </div>
      {help && (
        <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
          {help}
        </Paragraph>
      )}
      {editing ? (
        <Space.Compact style={{ width: '100%', maxWidth: 520 }}>
          <Input.Password
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste new key"
            autoFocus
          />
          <Button type="primary" loading={saving} onClick={handleSave} disabled={!draft.trim()}>
            Save
          </Button>
          <Button
            onClick={() => {
              setEditing(false);
              setDraft('');
            }}
          >
            Cancel
          </Button>
        </Space.Compact>
      ) : (
        <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
          {configured ? 'Replace' : 'Set key'}
        </Button>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [models, setModels] = useState<OrModel[] | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsDoc>({});
  const [selectedModel, setSelectedModel] = useState<string | undefined>();
  const [savedModel, setSavedModel] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [savingModel, setSavingModel] = useState(false);
  const [search, setSearch] = useState('');

  // Prompt editor state
  const [defaults, setDefaults] = useState<PromptDefaults | null>(null);
  const [basePromptDraft, setBasePromptDraft] = useState('');
  const [basePromptSaved, setBasePromptSaved] = useState('');
  const [savingBase, setSavingBase] = useState(false);
  const [structuringDraft, setStructuringDraft] = useState('');
  const [structuringSaved, setStructuringSaved] = useState('');
  const [savingStructuring, setSavingStructuring] = useState(false);

  const loadSettings = async () => {
    const res = await fetch('/api/admin/settings');
    if (res.ok) {
      const json = (await res.json()) as SettingsDoc;
      setSettings(json);
      const current = (json.openrouterModel as string) || undefined;
      setSelectedModel(current);
      setSavedModel(current);
      const base = (json.basePrompt as string) || '';
      setBasePromptDraft(base);
      setBasePromptSaved(base);
      const structuring = (json.structuringPrompt as string) || '';
      setStructuringDraft(structuring);
      setStructuringSaved(structuring);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setModelError(null);
    // Load the three data sources independently so one outage (usually a
    // flaky OpenRouter) doesn't blank the entire Settings page — users can
    // still edit API keys and prompts while the model catalog is down.
    await loadSettings().catch((err) => {
      console.warn('loadSettings failed', err);
    });
    try {
      const defaultsRes = await fetch('/api/admin/prompt-defaults');
      if (defaultsRes.ok) setDefaults(await defaultsRes.json());
    } catch (err) {
      console.warn('prompt-defaults fetch failed', err);
    }
    try {
      const modelsRes = await fetch('/api/admin/openrouter/models');
      if (!modelsRes.ok) {
        const err = await modelsRes.json().catch(() => ({}));
        throw new Error(err.error || `Models fetch failed (${modelsRes.status})`);
      }
      const modelsJson = await modelsRes.json();
      setModels(modelsJson.models || []);
    } catch (err) {
      setModelError(err instanceof Error ? err.message : 'Failed to load OpenRouter catalog');
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async (
    key: 'basePrompt' | 'structuringPrompt',
    value: string,
    setSaving: (v: boolean) => void,
    onSaved: (v: string) => void,
  ) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }
      onSaved(value);
      antdMessage.success(value ? 'Prompt saved.' : 'Reset to default.');
    } catch (err) {
      antdMessage.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const saveSecret = async (key: string, value: string) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }
      antdMessage.success(`${key} saved.`);
      await loadSettings();
    } catch (err) {
      antdMessage.error(err instanceof Error ? err.message : 'Save failed');
      throw err;
    }
  };

  const saveModel = async () => {
    setSavingModel(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openrouterModel: selectedModel ?? '' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Save failed (${res.status})`);
      }
      setSavedModel(selectedModel);
      antdMessage.success(
        selectedModel ? 'Model saved.' : 'Cleared — will fall back to Gemini direct.',
      );
    } catch (err) {
      antdMessage.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingModel(false);
    }
  };

  const filtered = useMemo(() => {
    if (!models) return [];
    const q = search.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));
  }, [models, search]);

  const selectedModelObj = models?.find((m) => m.id === selectedModel);
  const hasUnsavedModel = selectedModel !== savedModel;

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
              Runtime-tunable knobs stored in the database. Changes take effect immediately — no
              redeploy.
            </Text>
          </div>

          {/* ===== API keys section ===== */}
          <Divider style={{ borderColor: 'rgba(91,33,182,0.3)' }}>
            <Text type="secondary">API keys</Text>
          </Divider>

          {loading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <SecretField
                label="OpenRouter API key"
                help={
                  <>
                    Used for bulk site structuring. Get a key at{' '}
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
                      openrouter.ai/keys
                    </a>
                    .
                  </>
                }
                state={settings.openrouterApiKey}
                onSave={(v) => saveSecret('openrouterApiKey', v)}
              />
              <SecretField
                label="ElevenLabs API key"
                help={
                  <>
                    Powers the <a href="/admin/voices">/admin/voices</a> library page. Get a key at{' '}
                    <a
                      href="https://elevenlabs.io/app/settings/api-keys"
                      target="_blank"
                      rel="noreferrer"
                    >
                      elevenlabs.io/app/settings/api-keys
                    </a>
                    .
                  </>
                }
                state={settings.elevenlabsApiKey}
                onSave={(v) => saveSecret('elevenlabsApiKey', v)}
              />
              <SecretField
                label="Google Gemini API key (fallback)"
                help={
                  <>
                    Used when no OpenRouter model is configured. Get a key at{' '}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                      aistudio.google.com/apikey
                    </a>
                    .
                  </>
                }
                state={settings.geminiApiKey}
                onSave={(v) => saveSecret('geminiApiKey', v)}
              />
              <Alert
                type="info"
                showIcon
                message="These keys cannot be managed here"
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>
                      <code>ADMIN_PASSWORD</code> — gates this page itself, must stay in env.
                    </li>
                    <li>
                      <code>MONGO_APP_PASSWORD</code> — Mongo needs it on container boot.
                    </li>
                    <li>
                      <code>NEXT_PUBLIC_VAPI_PUBLIC_KEY</code> — Next.js inlines it into the JS bundle at
                      build time, not runtime.
                    </li>
                  </ul>
                }
              />
            </Space>
          )}

          {/* ===== Prompts ===== */}
          <Divider style={{ borderColor: 'rgba(91,33,182,0.3)' }}>
            <Text type="secondary">Agent prompts</Text>
          </Divider>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Override the hardcoded prompts without redeploying. Leave a field empty to use the
            default. <strong>Structuring prompt</strong> only affects NEW clients when they get
            scraped. <strong>Base prompt</strong> affects NEW clients on scrape; to apply it to
            existing clients, re-run the scrape on each client from its edit page.
          </Paragraph>

          <div>
            <Text strong style={{ color: 'rgba(255,255,255,0.92)', display: 'block', marginBottom: 4 }}>
              Structuring prompt
            </Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              Instruction given to the LLM to convert raw scraped website text into the
              client-specific structured JSON (business info, services, FAQs, etc.).
            </Text>
            <Input.TextArea
              value={structuringDraft}
              onChange={(e) => setStructuringDraft(e.target.value)}
              placeholder={defaults?.structuringPrompt || 'Loading default…'}
              autoSize={{ minRows: 8, maxRows: 24 }}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
            <Space style={{ marginTop: 8 }}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={savingStructuring}
                disabled={structuringDraft === structuringSaved}
                onClick={() =>
                  savePrompt('structuringPrompt', structuringDraft, setSavingStructuring, (v) => {
                    setStructuringSaved(v);
                  })
                }
              >
                Save structuring prompt
              </Button>
              <Button
                disabled={!defaults || structuringDraft === (defaults?.structuringPrompt || '')}
                onClick={() => setStructuringDraft(defaults?.structuringPrompt || '')}
              >
                Load default into editor
              </Button>
              {structuringSaved && (
                <Button
                  danger
                  onClick={() =>
                    savePrompt('structuringPrompt', '', setSavingStructuring, (v) => {
                      setStructuringSaved(v);
                      setStructuringDraft('');
                    })
                  }
                >
                  Reset to default (clear override)
                </Button>
              )}
            </Space>
          </div>

          <div>
            <Text strong style={{ color: 'rgba(255,255,255,0.92)', display: 'block', marginBottom: 4 }}>
              Base agent prompt
            </Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              The shared &quot;soul&quot; prompt (identity, tone, pacing rules, END_CALL protocol) injected at
              the top of every client&apos;s system instruction. The structured knowledge appears below it.
            </Text>
            <Input.TextArea
              value={basePromptDraft}
              onChange={(e) => setBasePromptDraft(e.target.value)}
              placeholder={defaults?.basePrompt || 'Loading default…'}
              autoSize={{ minRows: 10, maxRows: 30 }}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
            <Space style={{ marginTop: 8 }}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={savingBase}
                disabled={basePromptDraft === basePromptSaved}
                onClick={() =>
                  savePrompt('basePrompt', basePromptDraft, setSavingBase, (v) => {
                    setBasePromptSaved(v);
                  })
                }
              >
                Save base prompt
              </Button>
              <Button
                disabled={!defaults || basePromptDraft === (defaults?.basePrompt || '')}
                onClick={() => setBasePromptDraft(defaults?.basePrompt || '')}
              >
                Load default into editor
              </Button>
              {basePromptSaved && (
                <Button
                  danger
                  onClick={() =>
                    savePrompt('basePrompt', '', setSavingBase, (v) => {
                      setBasePromptSaved(v);
                      setBasePromptDraft('');
                    })
                  }
                >
                  Reset to default (clear override)
                </Button>
              )}
            </Space>
          </div>

          {/* ===== Model picker ===== */}
          <Divider style={{ borderColor: 'rgba(91,33,182,0.3)' }}>
            <Text type="secondary">Site structuring model</Text>
          </Divider>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Which OpenRouter model analyzes a scraped website into the structured JSON the agent uses.
            Cheapest models are listed first. Leave empty to fall back to Gemini 2.5 Pro direct.
          </Paragraph>

          {modelError && (
            <Alert
              type="error"
              showIcon
              message="Could not load OpenRouter catalog"
              description={modelError}
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
                value={selectedModel}
                onChange={(v) => setSelectedModel(v || undefined)}
                placeholder="Pick a model"
                style={{ width: '100%', maxWidth: 720 }}
                size="large"
                filterOption={(input, option) =>
                  String(option?.searchText || '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                listHeight={480}
                options={filtered.map((m) => ({
                  value: m.id,
                  searchText: `${m.id} ${m.name}`,
                  label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div
                          style={{
                            color: 'rgba(255,255,255,0.95)',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {m.name}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>{m.id}</div>
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

              {selectedModelObj && (
                <Alert
                  type="info"
                  showIcon
                  message={
                    <>
                      <strong>{selectedModelObj.name}</strong> · in{' '}
                      {formatPrice(selectedModelObj.promptPerM)}/M · out{' '}
                      {formatPrice(selectedModelObj.completionPerM)}/M ·{' '}
                      {formatContext(selectedModelObj.contextLength)}
                    </>
                  }
                  description={
                    <div>
                      Estimated cost at ~50k input / 2k output per client:{' '}
                      <strong>
                        {selectedModelObj.promptPerM != null && selectedModelObj.completionPerM != null
                          ? `$${(
                              (selectedModelObj.promptPerM * 50_000 +
                                selectedModelObj.completionPerM * 2_000) /
                              1_000_000
                            ).toFixed(4)}`
                          : 'unknown'}
                      </strong>{' '}
                      per client · 5,000 clients ≈{' '}
                      <strong>
                        {selectedModelObj.promptPerM != null && selectedModelObj.completionPerM != null
                          ? `$${(
                              (5_000 *
                                (selectedModelObj.promptPerM * 50_000 +
                                  selectedModelObj.completionPerM * 2_000)) /
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
                  onClick={saveModel}
                  loading={savingModel}
                  disabled={!hasUnsavedModel}
                >
                  Save model
                </Button>
                <Button icon={<ReloadOutlined />} onClick={loadAll} disabled={savingModel}>
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
