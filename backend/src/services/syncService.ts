import { getMetaApiClient } from './metaApi';
import prisma from '../utils/prisma';
import Logger from '../utils/logger';

interface SyncStats {
  campaigns: { created: number; updated: number };
  adsets: { created: number; updated: number };
  ads: { created: number; updated: number };
  metrics: { created: number };
}

interface SyncResult {
  success: boolean;
  stats: SyncStats;
  errors: string[];
  duration: number;
}

class SyncService {
  private metaApi = getMetaApiClient();

  /**
   * Sync all campaigns from Meta API to database
   */
  async syncCampaigns(): Promise<{ created: number; updated: number }> {
    Logger.info('Starting campaign sync...');
    let created = 0;
    let updated = 0;

    try {
      const campaigns = await this.metaApi.getCampaigns();

      for (const campaign of campaigns) {
        const existingCampaign = await prisma.campaign.findUnique({
          where: { campaignId: campaign.id },
        });

        const campaignData = {
          campaignId: campaign.id,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective || null,
          dailyBudget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : null,
        };

        if (existingCampaign) {
          await prisma.campaign.update({
            where: { campaignId: campaign.id },
            data: campaignData,
          });
          updated++;
        } else {
          await prisma.campaign.create({
            data: campaignData,
          });
          created++;
        }
      }

      Logger.info(`Campaign sync complete: ${created} created, ${updated} updated`);
      return { created, updated };
    } catch (error) {
      Logger.error('Campaign sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync all ad sets from Meta API to database
   */
  async syncAdSets(): Promise<{ created: number; updated: number }> {
    Logger.info('Starting ad set sync...');
    let created = 0;
    let updated = 0;

    try {
      const adsets = await this.metaApi.getAllAdSets();

      for (const adset of adsets) {
        const existingAdSet = await prisma.adSet.findUnique({
          where: { adsetId: adset.id },
        });

        const adsetData = {
          adsetId: adset.id,
          campaignId: adset.campaign_id,
          name: adset.name,
          status: adset.status,
          targeting: adset.targeting || null,
          placement: adset.placement || null,
          budget: adset.daily_budget ? parseFloat(adset.daily_budget) / 100 : null,
        };

        if (existingAdSet) {
          await prisma.adSet.update({
            where: { adsetId: adset.id },
            data: adsetData,
          });
          updated++;
        } else {
          await prisma.adSet.create({
            data: adsetData,
          });
          created++;
        }
      }

      Logger.info(`Ad set sync complete: ${created} created, ${updated} updated`);
      return { created, updated };
    } catch (error) {
      Logger.error('Ad set sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync all ads from Meta API to database
   */
  async syncAds(): Promise<{ created: number; updated: number }> {
    Logger.info('Starting ads sync...');
    let created = 0;
    let updated = 0;

    try {
      const ads = await this.metaApi.getAllAds();

      for (const ad of ads) {
        const existingAd = await prisma.ad.findUnique({
          where: { adId: ad.id },
        });

        const adData = {
          adId: ad.id,
          adsetId: ad.adset_id,
          name: ad.name,
          status: ad.status,
          creativeId: ad.creative?.id || null,
          thumbnailUrl: ad.creative?.thumbnail_url || null,
        };

        if (existingAd) {
          await prisma.ad.update({
            where: { adId: ad.id },
            data: adData,
          });
          updated++;
        } else {
          await prisma.ad.create({
            data: adData,
          });
          created++;
        }
      }

      Logger.info(`Ads sync complete: ${created} created, ${updated} updated`);
      return { created, updated };
    } catch (error) {
      Logger.error('Ads sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync metrics for all campaigns (last 7 days)
   */
  async syncMetrics(): Promise<{ created: number }> {
    Logger.info('Starting metrics sync...');
    let created = 0;

    try {
      // Get all campaigns
      const campaigns = await prisma.campaign.findMany();

      for (const campaign of campaigns) {
        try {
          // Fetch insights for last 7 days
          const insights = await this.metaApi.getInsights(campaign.campaignId, 'last_7d', '1');

          for (const insight of insights) {
            // Extract conversions from actions array
            let conversions = 0;
            if (insight.actions) {
              const conversionAction = insight.actions.find(
                (action: any) => action.action_type === 'offsite_conversion.fb_pixel_purchase'
              );
              conversions = conversionAction ? parseInt(conversionAction.value) : 0;
            }

            const spend = parseFloat(insight.spend || '0');
            const impressions = parseInt(insight.impressions || '0');
            const clicks = parseInt(insight.clicks || '0');
            const cpc = parseFloat(insight.cpc || '0');
            const ctr = parseFloat(insight.ctr || '0');

            // Calculate ROAS (assuming conversion value is tracked)
            let roas = 0;
            if (spend > 0 && conversions > 0) {
              // This is simplified - in production, you'd get actual conversion values
              roas = (conversions * 50) / spend; // Assuming $50 average order value
            }

            // Upsert metric (create or skip if exists)
            await prisma.dailyMetric.upsert({
              where: {
                entityId_entityType_date: {
                  entityId: campaign.campaignId,
                  entityType: 'campaign',
                  date: new Date(insight.date_start),
                },
              },
              update: {
                spend,
                impressions,
                clicks,
                conversions,
                cpc,
                ctr,
                roas,
              },
              create: {
                entityId: campaign.campaignId,
                entityType: 'campaign',
                date: new Date(insight.date_start),
                spend,
                impressions,
                clicks,
                conversions,
                cpc,
                ctr,
                roas,
              },
            });
            created++;
          }
        } catch (error) {
          Logger.warn(`Failed to sync metrics for campaign ${campaign.campaignId}:`, error);
          // Continue with next campaign
        }
      }

      Logger.info(`Metrics sync complete: ${created} records created/updated`);
      return { created };
    } catch (error) {
      Logger.error('Metrics sync failed:', error);
      throw error;
    }
  }

  /**
   * Run full sync - campaigns, ad sets, ads, and metrics
   */
  async runFullSync(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    const stats: SyncStats = {
      campaigns: { created: 0, updated: 0 },
      adsets: { created: 0, updated: 0 },
      ads: { created: 0, updated: 0 },
      metrics: { created: 0 },
    };

    Logger.info('🚀 Starting full sync...');

    try {
      // Sync campaigns
      try {
        stats.campaigns = await this.syncCampaigns();
      } catch (error: any) {
        errors.push(`Campaign sync error: ${error.message}`);
      }

      // Sync ad sets
      try {
        stats.adsets = await this.syncAdSets();
      } catch (error: any) {
        errors.push(`Ad set sync error: ${error.message}`);
      }

      // Sync ads
      try {
        stats.ads = await this.syncAds();
      } catch (error: any) {
        errors.push(`Ads sync error: ${error.message}`);
      }

      // Sync metrics
      try {
        stats.metrics = await this.syncMetrics();
      } catch (error: any) {
        errors.push(`Metrics sync error: ${error.message}`);
      }

      const duration = Date.now() - startTime;
      const success = errors.length === 0;

      Logger.info(`✅ Full sync completed in ${duration}ms. Success: ${success}`);
      Logger.info(`Stats: ${JSON.stringify(stats)}`);

      return {
        success,
        stats,
        errors,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      Logger.error('Full sync failed:', error);

      return {
        success: false,
        stats,
        errors: [...errors, `Fatal error: ${error.message}`],
        duration,
      };
    }
  }
}

// Export singleton
let syncServiceInstance: SyncService | null = null;

export function getSyncService(): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService();
  }
  return syncServiceInstance;
}

export default SyncService;
