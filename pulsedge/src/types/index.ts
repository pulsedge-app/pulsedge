export type Bias = 'Bullish' | 'Bearish' | 'Neutral';

export interface DailyAnalysis {
  id: string;
  symbol: string;
  date: string;
  bias: Bias;
  reasoning: string;
  key_levels: KeyLevel[];
  entry_zones: EntryZone[];
  invalidation_points: InvalidationPoint[];
  price_at_analysis: number | null;
  created_at: string;
}

export interface KeyLevel {
  price: number;
  label: string;
  type: 'support' | 'resistance' | 'pivot';
}

export interface EntryZone {
  entry: number;
  stop_loss: number;
  take_profit: number[];
  direction: 'long' | 'short';
  notes: string;
}

export interface InvalidationPoint {
  price: number;
  condition: string;
}

export interface MarketSymbol {
  symbol: string;
  tvSymbol: string;
  tdSymbol: string;
  label: string;
  category: 'forex' | 'crypto' | 'stocks';
}

export interface CalendarEvent {
  title: string;
  country: string;
  date: string;
  time: string;
  impact: 'High' | 'Medium' | 'Low';
  forecast: string;
  previous: string;
  actual: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface CommunityMessage {
  id: string;
  user_id: string | null;
  username: string;
  message: string;
  is_bot: boolean;
  created_at: string;
}

export interface LivePriceData {
  price: number;
  change_percent: number;
  loading: boolean;
}
