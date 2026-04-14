'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Card,
  Typography,
  Upload,
  Button,
  Select,
  Table,
  Space,
  Alert,
  Progress,
  Tag,
  message as antdMessage,
  Divider,
} from 'antd';
import { InboxOutlined, DownloadOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { APP_CONFIG } from '@/constants';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

type ParsedRow = Record<string, unknown>;

type BulkResult = {
  created: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
};

type Status = {
  total: number;
  done: number;
  pending: number;
  inProgress: number;
  failed: number;
};

export default function BulkClientsPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [domainColumn, setDomainColumn] = useState<string>('');
  const [nameColumn, setNameColumn] = useState<string>('');
  const [languagesColumn, setLanguagesColumn] = useState<string>('');
  const [defaultLanguages, setDefaultLanguages] = useState<Array<'en' | 'hi'>>(['en']);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [scraping, setScraping] = useState(false);
  const stopRef = useRef(false);

  const refreshStatus = async () => {
    try {
      const res = await fetch('/api/clients/bulk-status');
      if (!res.ok) return;
      setStatus(await res.json());
    } catch {}
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  /** Parse the dropped/selected xlsx in the browser. */
  const handleFile = (file: File): boolean => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<ParsedRow>(firstSheet, { defval: '' });
        if (json.length === 0) {
          antdMessage.error('Spreadsheet is empty.');
          return;
        }
        const cols = Object.keys(json[0]);
        setRows(json);
        setColumns(cols);
        // Heuristic: pre-select a column that looks like a domain.
        const guess =
          cols.find((c) => /domain|website|url|site/i.test(c)) || cols[0];
        setDomainColumn(guess);
        const nameGuess = cols.find((c) => /^name$|business|company|client/i.test(c));
        if (nameGuess) setNameColumn(nameGuess);
        const langGuess = cols.find((c) => /lang|language/i.test(c));
        if (langGuess) setLanguagesColumn(langGuess);
        setResult(null);
        antdMessage.success(`Loaded ${json.length} rows.`);
      } catch (err) {
        antdMessage.error('Could not parse the spreadsheet.');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
    return false; // prevent antd auto-upload
  };

  const upload = async () => {
    if (!domainColumn) {
      antdMessage.error('Pick the domain column first.');
      return;
    }
    setUploading(true);
    try {
      const res = await fetch('/api/clients/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows,
          domainColumn,
          nameColumn: nameColumn || undefined,
          languagesColumn: languagesColumn || undefined,
          defaultLanguages,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setResult(json);
      antdMessage.success(`Created ${json.created} clients.`);
      await refreshStatus();
    } catch (err) {
      antdMessage.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const startScraping = async () => {
    setScraping(true);
    stopRef.current = false;
    try {
      // Polling loop: one client per request keeps each call short and lets
      // the user see live progress.
      while (!stopRef.current) {
        const res = await fetch('/api/clients/scrape-pending', { method: 'POST' });
        if (!res.ok) {
          antdMessage.error('Scrape worker error — paused.');
          break;
        }
        const json = await res.json();
        await refreshStatus();
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

  const downloadXlsx = () => {
    window.location.href = '/api/clients/export';
  };

  const previewCols = columns.map((c) => ({ title: c, dataIndex: c, key: c, ellipsis: true }));
  const progressPercent = status && status.total > 0 ? Math.round((status.done / status.total) * 100) : 0;

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
          <div>
            <Title level={3} style={{ marginBottom: 4, color: 'rgba(255,255,255,0.95)' }}>
              Bulk upload clients
            </Title>
            <Text type="secondary">
              Drop an Excel file, choose which column holds the website domain, and we&apos;ll create one
              client per row. Scraping runs in the background — you can leave the page and come back.
            </Text>
          </div>

          <Dragger
            multiple={false}
            accept=".xlsx,.xls,.csv"
            beforeUpload={handleFile}
            showUploadList={false}
            style={{ background: '#1a0a2e', borderColor: 'rgba(91, 33, 182, 0.4)' }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#a78bfa' }} />
            </p>
            <p className="ant-upload-text" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Click or drag an .xlsx / .csv file here
            </p>
            <p className="ant-upload-hint" style={{ color: 'rgba(255,255,255,0.65)' }}>
              First sheet only. Header row required.
            </p>
          </Dragger>

          {rows.length > 0 && (
            <>
              <Divider style={{ borderColor: 'rgba(91,33,182,0.3)' }}>
                <Text type="secondary">{rows.length} rows loaded</Text>
              </Divider>

              <Space wrap>
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>
                    Domain column (required)
                  </Text>
                  <Select
                    style={{ minWidth: 240 }}
                    value={domainColumn || undefined}
                    onChange={setDomainColumn}
                    options={columns.map((c) => ({ value: c, label: c }))}
                    placeholder="Pick the column with the website URL"
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>
                    Name column (optional)
                  </Text>
                  <Select
                    allowClear
                    style={{ minWidth: 240 }}
                    value={nameColumn || undefined}
                    onChange={(v) => setNameColumn(v || '')}
                    options={columns.map((c) => ({ value: c, label: c }))}
                    placeholder="Defaults to a humanized domain"
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>
                    Languages column (optional)
                  </Text>
                  <Select
                    allowClear
                    style={{ minWidth: 240 }}
                    value={languagesColumn || undefined}
                    onChange={(v) => setLanguagesColumn(v || '')}
                    options={columns.map((c) => ({ value: c, label: c }))}
                    placeholder="Cell values: en / hi / en,hi"
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>
                    Default languages
                  </Text>
                  <Select
                    mode="multiple"
                    style={{ minWidth: 240 }}
                    value={defaultLanguages}
                    onChange={(v) => setDefaultLanguages(v as Array<'en' | 'hi'>)}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'hi', label: 'Hindi' },
                    ]}
                  />
                </div>
                <div style={{ alignSelf: 'flex-end' }}>
                  <Button type="primary" loading={uploading} onClick={upload} disabled={!domainColumn}>
                    Create {rows.length} clients
                  </Button>
                </div>
              </Space>

              <Table
                size="small"
                rowKey={(_, i) => String(i)}
                columns={previewCols}
                dataSource={rows.slice(0, 5)}
                pagination={false}
                scroll={{ x: 'max-content' }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>Preview: first 5 rows.</Text>
            </>
          )}

          {result && (
            <Alert
              type={result.errors.length > 0 ? 'warning' : 'success'}
              showIcon
              message={`Created ${result.created} · Skipped ${result.skipped}`}
              description={
                result.errors.length > 0 ? (
                  <div>
                    {result.errors.slice(0, 5).map((e) => (
                      <div key={e.row}>
                        Row {e.row}: {e.reason}
                      </div>
                    ))}
                    {result.errors.length > 5 && <div>…and {result.errors.length - 5} more.</div>}
                  </div>
                ) : null
              }
            />
          )}

          <Divider style={{ borderColor: 'rgba(91,33,182,0.3)' }}>
            <Text type="secondary">Scraping queue</Text>
          </Divider>

          {status && (
            <>
              <Space wrap>
                <Tag color="green">{status.done} done</Tag>
                <Tag color="purple">{status.pending} pending</Tag>
                {status.inProgress > 0 && <Tag color="blue">{status.inProgress} in progress</Tag>}
                {status.failed > 0 && <Tag color="red">{status.failed} failed</Tag>}
                <Tag>{status.total} total</Tag>
              </Space>
              <Progress
                percent={progressPercent}
                status={scraping ? 'active' : status.pending === 0 ? 'success' : 'normal'}
                strokeColor="#a78bfa"
              />
              <Space>
                {scraping ? (
                  <Button icon={<PauseCircleOutlined />} onClick={stopScraping}>
                    Pause
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={startScraping}
                    disabled={status.pending === 0}
                  >
                    {status.pending > 0 ? `Scrape ${status.pending} pending` : 'Nothing pending'}
                  </Button>
                )}
                <Button icon={<DownloadOutlined />} onClick={downloadXlsx}>
                  Download .xlsx with unique URLs
                </Button>
                <Button onClick={refreshStatus}>Refresh status</Button>
              </Space>
              <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
                Scraping runs one client at a time so the page can show live progress. Each client takes
                ~10–60s depending on site size. You can pause and resume any time — pending rows survive
                container restarts.
              </Paragraph>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}
