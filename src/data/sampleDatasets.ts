import { Dataset } from '../types/data';
import { inferColumnMetadata } from '../utils/parser';

// 1. Global Enterprise Revenue & Performance
const rawSalesRows = [
  { Region: 'North America', Quarter: '2026-Q1', Category: 'Cloud Infrastructure', SubCategory: 'Compute', Units: 1420, UnitPrice: 850, Revenue: 1207000, Profit: 422450, MarginPct: 35.0, Channel: 'Direct Enterprise', Status: 'Closed Won' },
  { Region: 'North America', Quarter: '2026-Q1', Category: 'Security Solutions', SubCategory: 'Zero Trust Network', Units: 890, UnitPrice: 1200, Revenue: 1068000, Profit: 480600, MarginPct: 45.0, Channel: 'Partner Reseller', Status: 'Closed Won' },
  { Region: 'North America', Quarter: '2026-Q2', Category: 'Cloud Infrastructure', SubCategory: 'Database Clusters', Units: 1680, UnitPrice: 920, Revenue: 1545600, Profit: 571872, MarginPct: 37.0, Channel: 'Direct Enterprise', Status: 'Closed Won' },
  { Region: 'North America', Quarter: '2026-Q2', Category: 'Analytics & AI', SubCategory: 'Predictive Pipeline', Units: 1100, UnitPrice: 1450, Revenue: 1595000, Profit: 765600, MarginPct: 48.0, Channel: 'Direct Enterprise', Status: 'Closed Won' },
  { Region: 'North America', Quarter: '2026-Q3', Category: 'Developer Platform', SubCategory: 'CI/CD Fleet', Units: 2450, UnitPrice: 420, Revenue: 1029000, Profit: 329280, MarginPct: 32.0, Channel: 'Self Serve', Status: 'Closed Won' },
  { Region: 'North America', Quarter: '2026-Q3', Category: 'Security Solutions', SubCategory: 'Identity Access', Units: 1340, UnitPrice: 980, Revenue: 1313200, Profit: 551544, MarginPct: 42.0, Channel: 'Partner Reseller', Status: 'Closed Won' },
  { Region: 'North America', Quarter: '2026-Q4', Category: 'Analytics & AI', SubCategory: 'Vector Store & Search', Units: 1890, UnitPrice: 1600, Revenue: 3024000, Profit: 1542240, MarginPct: 51.0, Channel: 'Direct Enterprise', Status: 'Closed Won' },

  { Region: 'Europe (EMEA)', Quarter: '2026-Q1', Category: 'Cloud Infrastructure', SubCategory: 'Compute', Units: 1150, UnitPrice: 850, Revenue: 977500, Profit: 322575, MarginPct: 33.0, Channel: 'Partner Reseller', Status: 'Closed Won' },
  { Region: 'Europe (EMEA)', Quarter: '2026-Q1', Category: 'Security Solutions', SubCategory: 'Data Compliance', Units: 920, UnitPrice: 1350, Revenue: 1242000, Profit: 583740, MarginPct: 47.0, Channel: 'Direct Enterprise', Status: 'Closed Won' },
  { Region: 'Europe (EMEA)', Quarter: '2026-Q2', Category: 'Developer Platform', SubCategory: 'Container Runtime', Units: 1840, UnitPrice: 510, Revenue: 938400, Profit: 281520, MarginPct: 30.0, Channel: 'Self Serve', Status: 'Closed Won' },
  { Region: 'Europe (EMEA)', Quarter: '2026-Q2', Category: 'Analytics & AI', SubCategory: 'Predictive Pipeline', Units: 880, UnitPrice: 1450, Revenue: 1276000, Profit: 586960, MarginPct: 46.0, Channel: 'Direct Enterprise', Status: 'Closed Won' },
  { Region: 'Europe (EMEA)', Quarter: '2026-Q3', Category: 'Security Solutions', SubCategory: 'Zero Trust Network', Units: 1040, UnitPrice: 1200, Revenue: 1248000, Profit: 549120, MarginPct: 44.0, Channel: 'Partner Reseller', Status: 'Closed Won' },
  { Region: 'Europe (EMEA)', Quarter: '2026-Q4', Category: 'Analytics & AI', SubCategory: 'Vector Store & Search', Units: 1450, UnitPrice: 1600, Revenue: 2320000, Profit: 1160000, MarginPct: 50.0, Channel: 'Direct Enterprise', Status: 'Closed Won' },

  { Region: 'Asia Pacific', Quarter: '2026-Q1', Category: 'Cloud Infrastructure', SubCategory: 'Compute', Units: 1820, UnitPrice: 800, Revenue: 1456000, Profit: 451360, MarginPct: 31.0, Channel: 'Partner Reseller', Status: 'Closed Won' },
  { Region: 'Asia Pacific', Quarter: '2026-Q1', Category: 'Developer Platform', SubCategory: 'CI/CD Fleet', Units: 2900, UnitPrice: 400, Revenue: 1160000, Profit: 336400, MarginPct: 29.0, Channel: 'Self Serve', Status: 'Closed Won' },
  { Region: 'Asia Pacific', Quarter: '2026-Q2', Category: 'Analytics & AI', SubCategory: 'Realtime Streaming', Units: 1320, UnitPrice: 1300, Revenue: 1716000, Profit: 755040, MarginPct: 44.0, Channel: 'Direct Enterprise', Status: 'Closed Won' },
  { Region: 'Asia Pacific', Quarter: '2026-Q3', Category: 'Security Solutions', SubCategory: 'Identity Access', Units: 1150, UnitPrice: 950, Revenue: 1092500, Profit: 447925, MarginPct: 41.0, Channel: 'Partner Reseller', Status: 'Closed Won' },
  { Region: 'Asia Pacific', Quarter: '2026-Q4', Category: 'Analytics & AI', SubCategory: 'Vector Store & Search', Units: 2100, UnitPrice: 1550, Revenue: 3255000, Profit: 1627500, MarginPct: 50.0, Channel: 'Direct Enterprise', Status: 'Closed Won' },
  { Region: 'Asia Pacific', Quarter: '2026-Q4', Category: 'Cloud Infrastructure', SubCategory: 'Edge Nodes', Units: 2600, UnitPrice: 650, Revenue: 1690000, Profit: 574600, MarginPct: 34.0, Channel: 'Direct Enterprise', Status: 'Closed Won' },

  { Region: 'Latin America', Quarter: '2026-Q1', Category: 'Security Solutions', SubCategory: 'Zero Trust Network', Units: 420, UnitPrice: 1100, Revenue: 462000, Profit: 189420, MarginPct: 41.0, Channel: 'Partner Reseller', Status: 'Closed Won' },
  { Region: 'Latin America', Quarter: '2026-Q2', Category: 'Developer Platform', SubCategory: 'Container Runtime', Units: 890, UnitPrice: 490, Revenue: 436100, Profit: 122108, MarginPct: 28.0, Channel: 'Self Serve', Status: 'Closed Won' },
  { Region: 'Latin America', Quarter: '2026-Q3', Category: 'Cloud Infrastructure', SubCategory: 'Compute', Units: 650, UnitPrice: 810, Revenue: 526500, Profit: 157950, MarginPct: 30.0, Channel: 'Direct Enterprise', Status: 'Closed Won' },
  { Region: 'Latin America', Quarter: '2026-Q4', Category: 'Analytics & AI', SubCategory: 'Predictive Pipeline', Units: 720, UnitPrice: 1400, Revenue: 1008000, Profit: 443520, MarginPct: 44.0, Channel: 'Direct Enterprise', Status: 'Closed Won' },
];

const salesHeaders = Object.keys(rawSalesRows[0]);
export const enterpriseSalesDataset: Dataset = {
  id: 'enterprise-sales-2026',
  name: 'Global Enterprise Revenue & Performance',
  description: 'Enterprise quarterly sales, profit margins, product categories, and geographical distribution across global regions.',
  rows: rawSalesRows,
  columns: inferColumnMetadata(salesHeaders, rawSalesRows),
  sourceType: 'preset',
  uploadedAt: '2026-10-07',
};

// 2. SaaS Cohorts & Unit Economics
const rawSaaSRows = [
  { Month: 'Jan 2026', PlanTier: 'Starter', ActiveUsers: 4800, NewMRR: 24000, ChurnedMRR: 3600, NetRetentionPct: 104.2, CAC: 220, LTV: 1850, CSAT: 88.5 },
  { Month: 'Jan 2026', PlanTier: 'Growth', ActiveUsers: 1450, NewMRR: 58000, ChurnedMRR: 5200, NetRetentionPct: 112.0, CAC: 740, LTV: 6900, CSAT: 91.0 },
  { Month: 'Jan 2026', PlanTier: 'Enterprise', ActiveUsers: 310, NewMRR: 124000, ChurnedMRR: 6200, NetRetentionPct: 128.5, CAC: 4200, LTV: 52000, CSAT: 94.2 },

  { Month: 'Feb 2026', PlanTier: 'Starter', ActiveUsers: 5120, NewMRR: 26500, ChurnedMRR: 3400, NetRetentionPct: 105.1, CAC: 215, LTV: 1920, CSAT: 89.0 },
  { Month: 'Feb 2026', PlanTier: 'Growth', ActiveUsers: 1620, NewMRR: 64800, ChurnedMRR: 4800, NetRetentionPct: 114.2, CAC: 710, LTV: 7250, CSAT: 91.8 },
  { Month: 'Feb 2026', PlanTier: 'Enterprise', ActiveUsers: 338, NewMRR: 135200, ChurnedMRR: 5400, NetRetentionPct: 130.4, CAC: 4100, LTV: 54500, CSAT: 95.0 },

  { Month: 'Mar 2026', PlanTier: 'Starter', ActiveUsers: 5490, NewMRR: 28900, ChurnedMRR: 3100, NetRetentionPct: 106.8, CAC: 205, LTV: 2010, CSAT: 89.6 },
  { Month: 'Mar 2026', PlanTier: 'Growth', ActiveUsers: 1810, NewMRR: 72400, ChurnedMRR: 4500, NetRetentionPct: 116.5, CAC: 690, LTV: 7600, CSAT: 92.5 },
  { Month: 'Mar 2026', PlanTier: 'Enterprise', ActiveUsers: 372, NewMRR: 148800, ChurnedMRR: 4900, NetRetentionPct: 132.8, CAC: 3950, LTV: 58000, CSAT: 95.8 },

  { Month: 'Apr 2026', PlanTier: 'Starter', ActiveUsers: 5910, NewMRR: 31500, ChurnedMRR: 2900, NetRetentionPct: 107.5, CAC: 198, LTV: 2100, CSAT: 90.2 },
  { Month: 'Apr 2026', PlanTier: 'Growth', ActiveUsers: 2040, NewMRR: 81600, ChurnedMRR: 4100, NetRetentionPct: 118.9, CAC: 670, LTV: 8100, CSAT: 93.1 },
  { Month: 'Apr 2026', PlanTier: 'Enterprise', ActiveUsers: 415, NewMRR: 166000, ChurnedMRR: 4200, NetRetentionPct: 135.2, CAC: 3800, LTV: 61500, CSAT: 96.4 },

  { Month: 'May 2026', PlanTier: 'Starter', ActiveUsers: 6380, NewMRR: 34200, ChurnedMRR: 2800, NetRetentionPct: 108.4, CAC: 190, LTV: 2200, CSAT: 91.0 },
  { Month: 'May 2026', PlanTier: 'Growth', ActiveUsers: 2290, NewMRR: 91600, ChurnedMRR: 3900, NetRetentionPct: 120.6, CAC: 650, LTV: 8600, CSAT: 93.8 },
  { Month: 'May 2026', PlanTier: 'Enterprise', ActiveUsers: 462, NewMRR: 184800, ChurnedMRR: 3800, NetRetentionPct: 137.9, CAC: 3700, LTV: 65000, CSAT: 97.0 },

  { Month: 'Jun 2026', PlanTier: 'Starter', ActiveUsers: 6890, NewMRR: 37800, ChurnedMRR: 2600, NetRetentionPct: 109.8, CAC: 185, LTV: 2320, CSAT: 91.5 },
  { Month: 'Jun 2026', PlanTier: 'Growth', ActiveUsers: 2580, NewMRR: 103200, ChurnedMRR: 3700, NetRetentionPct: 122.4, CAC: 630, LTV: 9100, CSAT: 94.3 },
  { Month: 'Jun 2026', PlanTier: 'Enterprise', ActiveUsers: 518, NewMRR: 207200, ChurnedMRR: 3500, NetRetentionPct: 140.2, CAC: 3600, LTV: 69000, CSAT: 97.6 },
];

const saasHeaders = Object.keys(rawSaaSRows[0]);
export const saasMetricsDataset: Dataset = {
  id: 'saas-metrics-2026',
  name: 'SaaS Product Cohorts & Unit Economics',
  description: 'Monthly customer tiers, expansion MRR, churn rate, LTV-to-CAC ratios, and net retention metrics.',
  rows: rawSaaSRows,
  columns: inferColumnMetadata(saasHeaders, rawSaaSRows),
  sourceType: 'preset',
  uploadedAt: '2026-10-07',
};

// 3. Multi-Channel Digital Marketing Acquisition
const rawMarketingRows = [
  { Channel: 'Organic Search (SEO)', Campaign: 'Tech Whitepapers', Spend: 18500, Impressions: 840000, Clicks: 33600, Leads: 2850, Conversions: 480, CAC: 38.5, ROI: 410 },
  { Channel: 'Paid Search (SEM)', Campaign: 'High Intent Keywords', Spend: 62000, Impressions: 520000, Clicks: 28600, Leads: 3140, Conversions: 620, CAC: 100.0, ROI: 260 },
  { Channel: 'Developer Community', Campaign: 'Open Source Sponsorship', Spend: 24000, Impressions: 410000, Clicks: 22500, Leads: 2600, Conversions: 540, CAC: 44.4, ROI: 380 },
  { Channel: 'LinkedIn Ads', Campaign: 'CTO / VP Engineering', Spend: 54000, Impressions: 310000, Clicks: 12400, Leads: 1820, Conversions: 390, CAC: 138.5, ROI: 215 },
  { Channel: 'Tech Podcasts & Media', Campaign: 'Engineering Talks', Spend: 28000, Impressions: 650000, Clicks: 19500, Leads: 1420, Conversions: 290, CAC: 96.5, ROI: 245 },
  { Channel: 'Affiliate & Ecosystem', Campaign: 'Cloud Marketplace Co-Sell', Spend: 16000, Impressions: 190000, Clicks: 15200, Leads: 2100, Conversions: 460, CAC: 34.8, ROI: 490 },
  { Channel: 'Email Newsletters', Campaign: 'Product Changelog & Deep Dive', Spend: 8500, Impressions: 320000, Clicks: 25600, Leads: 2800, Conversions: 510, CAC: 16.7, ROI: 620 },
];

const marketingHeaders = Object.keys(rawMarketingRows[0]);
export const marketingFunnelDataset: Dataset = {
  id: 'marketing-funnel-2026',
  name: 'Multi-Channel Marketing Acquisition & ROI',
  description: 'Inbound channels, marketing spend, impressions, CTR, conversion rates, customer acquisition cost (CAC), and return on investment.',
  rows: rawMarketingRows,
  columns: inferColumnMetadata(marketingHeaders, rawMarketingRows),
  sourceType: 'preset',
  uploadedAt: '2026-10-07',
};

export const defaultDatasets: Dataset[] = [
  enterpriseSalesDataset,
  saasMetricsDataset,
  marketingFunnelDataset,
];
