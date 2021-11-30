export type UnitOfTime = 'y' | 'm' | 'w' | 'd'

interface AmountUnit {
  amount: number;
  unit: UnitOfTime;
}

export interface ArticleInfo {
  articleId: string;
  description: string;
}

export interface Article {
  articleId: string;
  title: string;
  createdAt: Date;
  description: string;
  paragraphs: string[];
  images: string[];
  keywords: string[];
  query: string
}

export interface Options {
  query: string;
  startDate: string | Date;
  endCondition: AmountUnit;
  dateRange: AmountUnit;
  maximumPage: number;
  delay: number;
  dateFormat: string;
}
