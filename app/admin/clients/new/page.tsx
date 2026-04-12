'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Form, Input, Button, Select, Typography, Space, message, Alert } from 'antd';
import { APP_CONFIG } from '@/constants';
import { useAvailableVoices } from '@/hooks/useAvailableVoices';

const { Title, Text } = Typography;

export default function NewClientPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const availableVoices = useAvailableVoices();

  /**
   * Two-step flow: create the client shell, then trigger the scrape pipeline.
   * We do it in two steps so the user sees progress and so the create succeeds
   * even if the scrape fails (they can retry from the edit page).
   */
  async function onFinish(values: { name: string; domain: string; voiceId: string }) {
    setCreating(true);
    try {
      const createRes = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error || `Create failed (${createRes.status})`);
      }
      const { slug } = await createRes.json();
      setCreatedSlug(slug);
      message.success('Client created. Scraping site…');

      setScraping(true);
      const scrapeRes = await fetch(`/api/clients/${slug}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: values.domain }),
      });
      if (!scrapeRes.ok) {
        const err = await scrapeRes.json().catch(() => ({}));
        message.warning(
          err.error || 'Scrape failed — you can paste content manually on the edit page.',
          6,
        );
        router.push(`/admin/clients/${slug}`);
        return;
      }
      const out = await scrapeRes.json();
      message.success(
        `Scraped ${out.pagesScraped} page${out.pagesScraped === 1 ? '' : 's'} via ${out.method}. Review the context next.`,
      );
      router.push(`/admin/clients/${slug}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setCreating(false);
      setScraping(false);
    }
  }

  return (
      <div style={{ minHeight: '100vh', padding: 32, background: APP_CONFIG.secondaryColor }}>
        <Card
          variant="outlined"
          style={{
            maxWidth: 720,
            margin: '0 auto',
            border: '1px solid rgba(91, 33, 182, 0.4)',
            boxShadow: '0 0 40px rgba(91, 33, 182, 0.12)',
          }}
          styles={{ body: { padding: 32 } }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <Title level={3} style={{ marginBottom: 0 }}>
                  New Client
                </Title>
                <Text type="secondary">
                  Drop a domain. We&apos;ll scrape it, structure it with AI, and spin up a voice agent
                  at <code>/[slug]</code>.
                </Text>
              </div>
              <Button onClick={() => router.push('/admin/clients')}>← All clients</Button>
            </div>

            {scraping && (
              <Alert
                type="info"
                showIcon
                message="Scraping and structuring with AI…"
                description="This usually takes 20–60 seconds depending on the site size."
              />
            )}

            <Form layout="vertical" form={form} onFinish={onFinish} initialValues={{ voiceId: 'Kore' }}>
              <Form.Item
                label="Business name"
                name="name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="GlowLift Medspa" size="large" />
              </Form.Item>
              <Form.Item
                label="Website URL"
                name="domain"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="https://glowlift.com" size="large" />
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
              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" loading={creating || scraping} block>
                  {scraping ? 'Scraping & structuring…' : creating ? 'Creating…' : 'Create & scrape'}
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </div>
  );
}
