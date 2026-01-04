import axios, { AxiosInstance, AxiosError } from 'axios';
import Logger from '../utils/logger';

interface MetaApiConfig {
  accessToken: string;
  adAccountId: string;
  apiVersion?: string;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // in milliseconds
}

class MetaApiClient {
  private client: AxiosInstance;
  private accessToken: string;
  private adAccountId: string;
  private retryConfig: RetryConfig = {
    maxRetries: 4,
    baseDelay: 2000 // 2 seconds
  };

  constructor(config: MetaApiConfig) {
    this.accessToken = config.accessToken;
    this.adAccountId = config.adAccountId;

    const apiVersion = config.apiVersion || 'v18.0';

    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${apiVersion}`,
      timeout: 30000,
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        Logger.debug(`Meta API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        Logger.error('Meta API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 429) {
          Logger.warn('Rate limit hit, implementing backoff...');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Exponential backoff retry logic
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries >= this.retryConfig.maxRetries) {
        Logger.error(`Max retries (${this.retryConfig.maxRetries}) exceeded`);
        throw error;
      }

      const isRetryable =
        error.response?.status === 429 || // Rate limit
        error.response?.status >= 500 ||  // Server errors
        error.code === 'ECONNABORTED' ||  // Timeout
        error.code === 'ENOTFOUND';       // Network error

      if (!isRetryable) {
        throw error;
      }

      const delay = this.retryConfig.baseDelay * Math.pow(2, retries);
      Logger.warn(`Retrying in ${delay}ms (attempt ${retries + 1}/${this.retryConfig.maxRetries})`);

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, retries + 1);
    }
  }

  /**
   * Fetch all pages from a paginated Meta API endpoint
   */
  private async fetchAllPages(url: string, params: any): Promise<any[]> {
    let allResults: any[] = [];
    let nextPageUrl: string | null = null;
    let isFirstPage = true;

    while (isFirstPage || nextPageUrl) {
      let response: any;

      if (isFirstPage) {
        // First page: use relative URL with axios client (has baseURL)
        response = await this.client.get(url, { params });
        isFirstPage = false;
      } else {
        // Subsequent pages: use full URL from Meta's paging.next directly
        response = await axios.get(nextPageUrl!, { timeout: 30000 });
      }

      const data = response.data.data || [];
      allResults = allResults.concat(data);

      Logger.info(`Fetched page: ${data.length} items (total so far: ${allResults.length})`);

      // Check for next page
      nextPageUrl = response.data.paging?.next || null;
    }

    return allResults;
  }

  /**
   * Fetch all campaigns for the ad account
   */
  async getCampaigns(): Promise<any[]> {
    Logger.info(`Fetching campaigns for account: ${this.adAccountId}`);

    return this.retryWithBackoff(async () => {
      const response = await this.client.get(`/${this.adAccountId}/campaigns`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,status,objective,daily_budget,created_time,updated_time',
          limit: 100
        }
      });

      const campaigns = response.data.data || [];
      Logger.info(`Fetched ${campaigns.length} campaigns`);
      return campaigns;
    });
  }

  /**
   * Fetch ad sets for a specific campaign
   */
  async getAdSets(campaignId: string): Promise<any[]> {
    Logger.info(`Fetching ad sets for campaign: ${campaignId}`);

    return this.retryWithBackoff(async () => {
      const response = await this.client.get(`/${campaignId}/adsets`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,status,targeting,placement,budget_remaining,daily_budget,created_time',
          limit: 100
        }
      });

      const adsets = response.data.data || [];
      Logger.info(`Fetched ${adsets.length} ad sets for campaign ${campaignId}`);
      return adsets;
    });
  }

  /**
   * Fetch ads for a specific ad set
   */
  async getAds(adsetId: string): Promise<any[]> {
    Logger.info(`Fetching ads for ad set: ${adsetId}`);

    return this.retryWithBackoff(async () => {
      const response = await this.client.get(`/${adsetId}/ads`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,status,creative{id,thumbnail_url},created_time',
          limit: 100
        }
      });

      const ads = response.data.data || [];
      Logger.info(`Fetched ${ads.length} ads for ad set ${adsetId}`);
      return ads;
    });
  }

  /**
   * Fetch insights (metrics) for an entity (campaign, adset, or ad)
   */
  async getInsights(
    entityId: string,
    datePreset: string = 'last_30d',
    timeIncrement: string = '1'
  ): Promise<any[]> {
    Logger.info(`Fetching insights for entity: ${entityId}`);

    return this.retryWithBackoff(async () => {
      const response = await this.client.get(`/${entityId}/insights`, {
        params: {
          access_token: this.accessToken,
          date_preset: datePreset,
          time_increment: timeIncrement,
          fields: 'spend,impressions,clicks,actions,action_values,cpc,ctr,cpm',
          limit: 100
        }
      });

      const insights = response.data.data || [];
      Logger.info(`Fetched ${insights.length} insight records for ${entityId}`);
      return insights;
    });
  }

  /**
   * Fetch insights for a specific date range
   */
  async getInsightsDateRange(
    entityId: string,
    startDate: string, // YYYY-MM-DD
    endDate: string,    // YYYY-MM-DD
    timeIncrement: string = '1'
  ): Promise<any[]> {
    Logger.info(`Fetching insights for ${entityId} from ${startDate} to ${endDate}`);

    return this.retryWithBackoff(async () => {
      const response = await this.client.get(`/${entityId}/insights`, {
        params: {
          access_token: this.accessToken,
          time_range: JSON.stringify({ since: startDate, until: endDate }),
          time_increment: timeIncrement,
          fields: 'spend,impressions,clicks,actions,action_values,cpc,ctr,cpm',
          limit: 100
        }
      });

      const insights = response.data.data || [];
      Logger.info(`Fetched ${insights.length} insight records`);
      return insights;
    });
  }

  /**
   * Get all ad sets across all campaigns (with pagination)
   */
  async getAllAdSets(): Promise<any[]> {
    Logger.info('Fetching all ad sets (paginated)');

    return this.retryWithBackoff(async () => {
      const adsets = await this.fetchAllPages(`/${this.adAccountId}/adsets`, {
        access_token: this.accessToken,
        fields: 'id,campaign_id,name,status,targeting,placement,daily_budget,created_time',
        limit: 100
      });

      Logger.info(`Fetched ${adsets.length} total ad sets (all pages)`);
      return adsets;
    });
  }

  /**
   * Get all ads across the account (with pagination)
   */
  async getAllAds(): Promise<any[]> {
    Logger.info('Fetching all ads (paginated)');

    return this.retryWithBackoff(async () => {
      const ads = await this.fetchAllPages(`/${this.adAccountId}/ads`, {
        access_token: this.accessToken,
        fields: 'id,adset_id,name,status,creative{id,thumbnail_url},created_time',
        limit: 100
      });

      Logger.info(`Fetched ${ads.length} total ads (all pages)`);
      return ads;
    });
  }
}

// Export singleton instance
let metaApiInstance: MetaApiClient | null = null;

export function getMetaApiClient(): MetaApiClient {
  if (!metaApiInstance) {
    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    if (!accessToken || !adAccountId) {
      throw new Error('META_ACCESS_TOKEN and META_AD_ACCOUNT_ID must be set in environment variables');
    }

    metaApiInstance = new MetaApiClient({
      accessToken,
      adAccountId
    });
  }

  return metaApiInstance;
}

export default MetaApiClient;
