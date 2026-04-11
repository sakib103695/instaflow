'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ConfigProvider,
  Card,
  Form,
  Input,
  Button,
  Select,
  Typography,
  Space,
  Tabs,
  message,
  theme,
  Modal,
  Tag,
  Skeleton,
} from 'antd';
import type { ThemeConfig } from 'antd';
import { APP_CONFIG } from '@/constants';
import { useAvailableVoices } from '@/hooks/useAvailableVoices';
import type { ClientDoc, StructuredContext } from '@/lib/clientTypes';

const { darkAlgorithm } = theme;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ADMIN_THEME: ThemeConfig = {
  algorithm: darkAlgorithm,
  token: {
    colorPrimary: APP_CONFIG.primaryColor,
    colorBgContainer: '#1a0a2e',
    colorBgElevated: '#251044',
    colorBorder: 'rgba(91, 33, 182, 0.35)',
  },
};

export default function EditClientPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';
  const router = useRouter();

  const [client, setClient] = useState<ClientDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rescraping, setRescraping] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${slug}`);
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setClient(await res.json());
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) load();
  }, [slug]);

  async function save(patch: Partial<ClientDoc>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      message.success('Saved');
      await load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function rescrape(payload: { domain?: string; manualText?: string } = {}) {
    if (!client) return;
    setRescraping(true);
    try {
      const res = await fetch(`/api/clients/${slug}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: client.domain, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
      message.success(
        payload.manualText
          ? 'Structured manual content with AI'
          : `Scraped ${data.pagesScraped} page(s) via ${data.method}`,
      );
      setManualOpen(false);
      setManualText('');
      await load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Scrape failed');
    } finally {
      setRescraping(false);
    }
  }

  if (loading || !client) {
    return (
      <ConfigProvider theme={ADMIN_THEME}>
        <div style={{ minHeight: '100vh', padding: 32, background: APP_CONFIG.secondaryColor }}>
          <Card style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Skeleton active paragraph={{ rows: 10 }} />
          </Card>
        </div>
      </ConfigProvider>
    );
  }

  const ctx = client.structuredContext;

  return (
    <ConfigProvider theme={ADMIN_THEME}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Title level={3} style={{ marginBottom: 4 }}>
                  {client.name}
                </Title>
                <Space size="small" wrap>
                  <Tag>{client.slug}</Tag>
                  <Tag color="purple">{client.voiceId}</Tag>
                  {client.isDefault && <Tag color="gold">Default</Tag>}
                  <a
                    href={client.isDefault ? '/' : `/?client=${client.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#a78bfa' }}
                  >
                    {client.isDefault ? '/ ↗' : `/?client=${client.slug} ↗`}
                  </a>
                </Space>
              </div>
              <Space>
                <Button onClick={() => router.push('/admin/clients')}>← All clients</Button>
                <Button onClick={() => rescrape()} loading={rescraping}>
                  Re-scrape
                </Button>
                <Button onClick={() => setManualOpen(true)}>Paste manual content</Button>
              </Space>
            </div>

            <Tabs
              defaultActiveKey="basic"
              items={[
                {
                  key: 'basic',
                  label: 'Basics',
                  children: (
                    <BasicsTab
                      client={client}
                      saving={saving}
                      onSave={(patch) => save(patch)}
                    />
                  ),
                },
                {
                  key: 'context',
                  label: 'Structured Context',
                  children: (
                    <ContextTab
                      ctx={ctx}
                      saving={saving}
                      onSave={(structuredContext) => save({ structuredContext })}
                    />
                  ),
                },
                {
                  key: 'prompt',
                  label: 'Final Prompt',
                  children: (
                    <PromptTab
                      systemPrompt={client.systemPrompt}
                      saving={saving}
                      onSave={(systemPrompt) => save({ systemPrompt })}
                    />
                  ),
                },
                {
                  key: 'raw',
                  label: 'Raw Scrape',
                  children: (
                    <Paragraph>
                      <Text type="secondary">
                        {client.scrapeMeta?.pagesScraped ?? 0} page(s) via {client.scrapeMeta?.method ?? 'manual'}
                        {client.scrapeMeta?.scrapedAt
                          ? ` on ${new Date(client.scrapeMeta.scrapedAt).toLocaleString()}`
                          : ''}
                      </Text>
                      <TextArea
                        value={client.rawScrape}
                        rows={20}
                        readOnly
                        style={{ marginTop: 12, fontFamily: 'monospace', fontSize: 12 }}
                      />
                    </Paragraph>
                  ),
                },
              ]}
            />
          </Space>
        </Card>

        <Modal
          title="Paste manual content"
          open={manualOpen}
          onCancel={() => setManualOpen(false)}
          onOk={() => rescrape({ manualText })}
          okText="Structure with AI"
          confirmLoading={rescraping}
          width={720}
        >
          <Text type="secondary">
            If the scraper failed or you want full control, paste website content (or anything you want
            the agent to know) here. AI will structure it into the agent&apos;s knowledge.
          </Text>
          <TextArea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            rows={16}
            style={{ marginTop: 12 }}
            placeholder="Paste services, prices, hours, FAQs, policies..."
          />
        </Modal>
      </div>
    </ConfigProvider>
  );
}

function BasicsTab({
  client,
  saving,
  onSave,
}: {
  client: ClientDoc;
  saving: boolean;
  onSave: (patch: Partial<ClientDoc>) => void;
}) {
  const [form] = Form.useForm();
  const availableVoices = useAvailableVoices();
  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={{
        name: client.name,
        domain: client.domain,
        voiceId: client.voiceId,
        greeting: client.greeting,
      }}
      onFinish={onSave}
    >
      <Form.Item label="Business name" name="name" rules={[{ required: true }]}>
        <Input size="large" />
      </Form.Item>
      <Form.Item label="Domain" name="domain" rules={[{ required: true }]}>
        <Input size="large" />
      </Form.Item>
      <Form.Item label="Voice" name="voiceId">
        <Select
          size="large"
          options={availableVoices.map((v) => ({
            value: v.id,
            label: v.description ? `${v.label} — ${v.description}` : v.label,
          }))}
        />
      </Form.Item>
      <Form.Item
        label="Opening greeting"
        name="greeting"
        extra="The exact line the agent says when the call connects."
      >
        <TextArea rows={2} />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={saving}>
        Save basics
      </Button>
    </Form>
  );
}

function ContextTab({
  ctx,
  saving,
  onSave,
}: {
  ctx: StructuredContext;
  saving: boolean;
  onSave: (ctx: StructuredContext) => void;
}) {
  // Edit as JSON for full power. Keeps the UI small while allowing every field.
  const [text, setText] = useState(() => JSON.stringify(ctx, null, 2));
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    try {
      const parsed = JSON.parse(text);
      setError(null);
      onSave(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Text type="secondary">
        This is the AI-extracted knowledge the agent uses to answer calls. Edit any field; on save it
        will be re-injected into the agent&apos;s system prompt automatically.
      </Text>
      {error && <Text type="danger">JSON error: {error}</Text>}
      <TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={28}
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />
      <Button type="primary" loading={saving} onClick={handleSave}>
        Save context (recomposes prompt)
      </Button>
    </Space>
  );
}

function PromptTab({
  systemPrompt,
  saving,
  onSave,
}: {
  systemPrompt: string;
  saving: boolean;
  onSave: (s: string) => void;
}) {
  const [text, setText] = useState(systemPrompt);
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Text type="secondary">
        This is the exact system prompt sent to Gemini for every call. It&apos;s auto-generated from the
        Structured Context, but you can override it here for fine-tuned wording. Be careful — bad
        prompts make for bad agents.
      </Text>
      <TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={32}
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />
      <Button type="primary" loading={saving} onClick={() => onSave(text)}>
        Save prompt override
      </Button>
    </Space>
  );
}
