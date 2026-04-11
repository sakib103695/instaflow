'use client';

import { Card, Typography } from 'antd';
import { APP_CONFIG } from '@/constants';

const { Title, Text } = Typography;

export default function AdminVoicesPage() {
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
        <Title level={3} style={{ marginBottom: 4, color: 'rgba(255,255,255,0.95)' }}>
          Voices
        </Title>
        <Text type="secondary">
          ElevenLabs voice library + curated picker. Coming soon.
        </Text>
      </Card>
    </div>
  );
}
