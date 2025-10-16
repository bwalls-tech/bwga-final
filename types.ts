import { LiveServerMessage, Modality, Blob } from "@google/genai";

export type View = 'mission' | 'opportunities' | 'report' | 'compliance' | 'sample-report';

export interface AnalyticalModule {
  id: string;
  name: string;
  description: string;
  status: 'Core' | 'Enterprise' | 'Future';
}

export interface AnalyticalModuleGroup {
  title: string;
  modules: AnalyticalModule[];
}

export interface ReportParameters {
  reportName: string;
  tier: string[];
  userName: string;
  userDepartment: string;
  organizationType: string;
  userCountry: string;
  aiPersona: string[];
  customAiPersona?: string;
  analyticalLens?: string[];
  toneAndStyle?: string[];
  region: string;
  industry: string[];
  customIndustry?: string;
  idealPartnerProfile: string;
  problemStatement: string;
  analysisTimeframe: string;
  analyticalModules: string[];
  localContext?: string;
}

export type ReportSuggestions = Partial<Pick<ReportParameters, 'reportName' | 'region' | 'problemStatement' | 'idealPartnerProfile'>> & {
    industry?: string; // Keep as string for simple suggestion
};


export interface LiveOpportunityItem {
  project_name: string;
  country: string;
  sector: string;
  value: string;
  summary: string;
  source_url: string;
  ai_feasibility_score?: number;
  ai_risk_assessment?: string;
  isUserAdded?: boolean;
}

export interface SymbiosisContext {
  topic: string;
  originalContent: string;
  reportParameters?: ReportParameters;
}

export interface UserProfile {
  userName: string;
  userDepartment:string;
  organizationType: string;
  userCountry: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface DashboardIntelligence {
    category: string;
    items: {
        company: string;
        details: string;
        implication: string;
        source: string;
        url: string;
    }[];
}

export interface NewsContent {
    headline: string;
    summary: string;
    source: string;
    link: string;
    region: string;
}

export interface IndicatorContent {
    name: string;
    value: string;
    change: number;
    region: string;
}

export type FeedPost = {
    id: string;
    timestamp: string;
} & (
    | { type: 'opportunity'; content: LiveOpportunityItem }
    | { type: 'news'; content: NewsContent }
    | { type: 'indicator'; content: IndicatorContent }
);

export interface InquireResult {
  answer: string;
  sources: { web: { uri: string; title: string; } }[];
}

export interface LiveOpportunitiesResponse {
    feed: FeedPost[];
    isMockData?: boolean;
}

export interface UNComtradeOptions {
  reporter?: string;
  partner?: string;
  tradeFlow?: string;
  year?: string;
  classification?: string;
}

export interface UNComtradeResponse {
  commodity: string;
  commodityCode: string;
  reporter: string;
  partner: string;
  tradeFlow: string;
  tradeValue: number;
  netWeight: number;
  year: string;
  period: string;
}

export interface WorldBankOptions {
  country?: string;
  date?: string;
  format?: string;
}

export interface WorldBankResponse {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number;
  unit: string;
  obs_status: string;
  decimal: number;
}

export interface AiCapability {
  title: string;
  description: string;
  prompt: string;
}

export interface AiCapabilitiesResponse {
    greeting: string;
    capabilities: AiCapability[];
}

export interface EconomicData {
  gdp?: { value: number; year: string };
  population?: { value: number; year: string };
  inflation?: { value: number; year: string };
  fdi?: { value: number; year: string };
}

export interface PredictiveAnalysis {
  emergingTrends: { trend: string; justification: string; }[];
  futureOpportunities: { opportunity: string; rationale: string; }[];
  potentialDisruptions: { disruption: string; impact: string; }[];
}