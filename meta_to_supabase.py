#!/usr/bin/env python3
"""
Meta Ads to Supabase ETL Script
Pulls Meta advertising data and loads it into Supabase with clean, validated data.
"""

import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from decimal import Decimal
import logging

# Third-party imports
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.campaign import Campaign
from facebook_business.adobjects.adset import AdSet
from facebook_business.adobjects.ad import Ad
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'meta_sync_{datetime.now().strftime("%Y%m%d")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration
META_ACCESS_TOKEN = os.getenv('META_ACCESS_TOKEN')
META_AD_ACCOUNT_ID = os.getenv('META_AD_ACCOUNT_ID')
META_API_VERSION = os.getenv('META_API_VERSION', 'v18.0')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
DAYS_TO_SYNC = int(os.getenv('DAYS_TO_SYNC', '7'))


class DataValidator:
    """Validates and cleans data before database insertion."""

    @staticmethod
    def safe_float(value, default=0.0) -> float:
        """Safely convert to float with default."""
        try:
            return float(value) if value is not None else default
        except (ValueError, TypeError):
            return default

    @staticmethod
    def safe_int(value, default=0) -> int:
        """Safely convert to int with default."""
        try:
            return int(value) if value is not None else default
        except (ValueError, TypeError):
            return default

    @staticmethod
    def calculate_ctr(clicks: int, impressions: int) -> float:
        """Calculate CTR with safe division."""
        if impressions > 0:
            return round((clicks / impressions) * 100, 4)
        return 0.0

    @staticmethod
    def calculate_cpc(spend: float, clicks: int) -> float:
        """Calculate CPC with safe division."""
        if clicks > 0:
            return round(spend / clicks, 4)
        return 0.0

    @staticmethod
    def calculate_cpm(spend: float, impressions: int) -> float:
        """Calculate CPM with safe division."""
        if impressions > 0:
            return round((spend / impressions) * 1000, 4)
        return 0.0

    @staticmethod
    def calculate_roas(revenue: float, spend: float) -> float:
        """Calculate ROAS with safe division."""
        if spend > 0:
            return round(revenue / spend, 4)
        return 0.0

    @staticmethod
    def extract_conversions(actions: Optional[List[Dict]]) -> int:
        """Extract conversion count from Meta actions array."""
        if not actions:
            return 0

        # Priority order for conversion actions
        priority_actions = [
            'offsite_conversion.fb_pixel_purchase',
            'purchase',
            'omni_purchase',
            'offsite_conversion.fb_pixel_complete_registration',
            'lead'
        ]

        for action_type in priority_actions:
            for action in actions:
                if action.get('action_type') == action_type:
                    return DataValidator.safe_int(action.get('value', 0))

        return 0

    @staticmethod
    def extract_revenue(action_values: Optional[List[Dict]]) -> float:
        """Extract revenue from Meta action_values array."""
        if not action_values:
            return 0.0

        # Priority order for revenue actions
        priority_actions = [
            'offsite_conversion.fb_pixel_purchase',
            'purchase',
            'omni_purchase'
        ]

        for action_type in priority_actions:
            for action_value in action_values:
                if action_value.get('action_type') == action_type:
                    return DataValidator.safe_float(action_value.get('value', 0))

        return 0.0


class MetaToSupabase:
    """Main ETL class for syncing Meta ads data to Supabase."""

    def __init__(self):
        """Initialize API clients."""
        # Initialize Meta API
        FacebookAdsApi.init(access_token=META_ACCESS_TOKEN, api_version=META_API_VERSION)
        self.ad_account = AdAccount(META_AD_ACCOUNT_ID)

        # Initialize Supabase client
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

        self.validator = DataValidator()
        logger.info("Initialized Meta and Supabase clients")

    def get_date_range(self, days: int = 7) -> tuple:
        """Get date range for sync (last N days)."""
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        return start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')

    def sync_campaigns(self, date_range: tuple) -> int:
        """Sync campaigns and their metrics."""
        logger.info("Starting campaign sync...")
        count = 0

        try:
            # Fetch campaigns
            campaigns = self.ad_account.get_campaigns(fields=[
                Campaign.Field.id,
                Campaign.Field.name,
                Campaign.Field.status,
                Campaign.Field.objective,
                Campaign.Field.daily_budget,
                Campaign.Field.lifetime_budget,
                Campaign.Field.effective_status,
            ])

            for campaign in campaigns:
                try:
                    # Sync campaign metadata
                    campaign_data = {
                        'campaign_id': campaign[Campaign.Field.id],
                        'name': campaign[Campaign.Field.name],
                        'status': campaign[Campaign.Field.status],
                        'objective': campaign.get(Campaign.Field.objective),
                        'daily_budget': self.validator.safe_float(campaign.get(Campaign.Field.daily_budget)) / 100 if campaign.get(Campaign.Field.daily_budget) else None,
                        'lifetime_budget': self.validator.safe_float(campaign.get(Campaign.Field.lifetime_budget)) / 100 if campaign.get(Campaign.Field.lifetime_budget) else None,
                        'effective_status': campaign.get(Campaign.Field.effective_status),
                    }

                    self.supabase.table('campaigns').upsert(
                        campaign_data,
                        on_conflict='campaign_id'
                    ).execute()

                    # Sync campaign metrics
                    self.sync_entity_metrics(
                        campaign[Campaign.Field.id],
                        'campaign',
                        Campaign(campaign[Campaign.Field.id]),
                        date_range
                    )

                    count += 1
                    logger.info(f"Synced campaign: {campaign[Campaign.Field.name]}")

                except Exception as e:
                    logger.error(f"Failed to sync campaign {campaign.get(Campaign.Field.id)}: {e}")
                    continue

            logger.info(f"Completed campaign sync: {count} campaigns")
            return count

        except Exception as e:
            logger.error(f"Campaign sync failed: {e}")
            raise

    def sync_adsets(self, date_range: tuple) -> int:
        """Sync adsets and their metrics."""
        logger.info("Starting adset sync...")
        count = 0

        try:
            # Fetch adsets
            adsets = self.ad_account.get_ad_sets(fields=[
                AdSet.Field.id,
                AdSet.Field.campaign_id,
                AdSet.Field.name,
                AdSet.Field.status,
                AdSet.Field.daily_budget,
                AdSet.Field.lifetime_budget,
                AdSet.Field.targeting,
                AdSet.Field.optimization_goal,
                AdSet.Field.billing_event,
                AdSet.Field.bid_strategy,
            ])

            for adset in adsets:
                try:
                    # Sync adset metadata
                    adset_data = {
                        'adset_id': adset[AdSet.Field.id],
                        'campaign_id': adset[AdSet.Field.campaign_id],
                        'name': adset[AdSet.Field.name],
                        'status': adset[AdSet.Field.status],
                        'budget': self.validator.safe_float(adset.get(AdSet.Field.daily_budget) or adset.get(AdSet.Field.lifetime_budget)) / 100 if (adset.get(AdSet.Field.daily_budget) or adset.get(AdSet.Field.lifetime_budget)) else None,
                        'targeting': adset.get(AdSet.Field.targeting),
                        'optimization_goal': adset.get(AdSet.Field.optimization_goal),
                        'billing_event': adset.get(AdSet.Field.billing_event),
                        'bid_strategy': adset.get(AdSet.Field.bid_strategy),
                    }

                    self.supabase.table('adsets').upsert(
                        adset_data,
                        on_conflict='adset_id'
                    ).execute()

                    # Sync adset metrics
                    self.sync_entity_metrics(
                        adset[AdSet.Field.id],
                        'adset',
                        AdSet(adset[AdSet.Field.id]),
                        date_range
                    )

                    count += 1
                    logger.info(f"Synced adset: {adset[AdSet.Field.name]}")

                except Exception as e:
                    logger.error(f"Failed to sync adset {adset.get(AdSet.Field.id)}: {e}")
                    continue

            logger.info(f"Completed adset sync: {count} adsets")
            return count

        except Exception as e:
            logger.error(f"AdSet sync failed: {e}")
            raise

    def sync_ads(self, date_range: tuple) -> int:
        """Sync ads and their metrics."""
        logger.info("Starting ad sync...")
        count = 0

        try:
            # Fetch ads
            ads = self.ad_account.get_ads(fields=[
                Ad.Field.id,
                Ad.Field.adset_id,
                Ad.Field.name,
                Ad.Field.status,
                Ad.Field.creative,
            ])

            for ad in ads:
                try:
                    # Extract creative info
                    creative = ad.get(Ad.Field.creative, {})

                    # Sync ad metadata
                    ad_data = {
                        'ad_id': ad[Ad.Field.id],
                        'adset_id': ad[Ad.Field.adset_id],
                        'name': ad[Ad.Field.name],
                        'status': ad[Ad.Field.status],
                        'creative_id': creative.get('id'),
                        'thumbnail_url': creative.get('thumbnail_url'),
                        'image_url': creative.get('image_url'),
                        'creative_body': creative.get('body'),
                        'creative_title': creative.get('title'),
                    }

                    self.supabase.table('ads').upsert(
                        ad_data,
                        on_conflict='ad_id'
                    ).execute()

                    # Sync ad metrics
                    self.sync_entity_metrics(
                        ad[Ad.Field.id],
                        'ad',
                        Ad(ad[Ad.Field.id]),
                        date_range
                    )

                    count += 1
                    logger.info(f"Synced ad: {ad[Ad.Field.name]}")

                except Exception as e:
                    logger.error(f"Failed to sync ad {ad.get(Ad.Field.id)}: {e}")
                    continue

            logger.info(f"Completed ad sync: {count} ads")
            return count

        except Exception as e:
            logger.error(f"Ad sync failed: {e}")
            raise

    def sync_entity_metrics(self, entity_id: str, entity_type: str, entity_obj, date_range: tuple):
        """Sync daily metrics for an entity (campaign/adset/ad)."""
        try:
            start_date, end_date = date_range

            # Fetch insights
            insights = entity_obj.get_insights(params={
                'time_range': {'since': start_date, 'until': end_date},
                'time_increment': 1,  # Daily granularity
                'level': entity_type,
                'fields': [
                    'spend',
                    'impressions',
                    'clicks',
                    'actions',
                    'action_values',
                    'cpc',
                    'ctr',
                    'cpm',
                    'frequency',
                    'reach',
                    'date_start',
                ],
            })

            # Process each day's metrics
            for insight in insights:
                try:
                    # Extract raw values
                    spend = self.validator.safe_float(insight.get('spend', 0))
                    impressions = self.validator.safe_int(insight.get('impressions', 0))
                    clicks = self.validator.safe_int(insight.get('clicks', 0))

                    # Extract conversions and revenue
                    conversions = self.validator.extract_conversions(insight.get('actions'))
                    revenue = self.validator.extract_revenue(insight.get('action_values'))

                    # Calculate metrics with safe division
                    ctr = self.validator.calculate_ctr(clicks, impressions)
                    cpc = self.validator.calculate_cpc(spend, clicks)
                    cpm = self.validator.calculate_cpm(spend, impressions)
                    roas = self.validator.calculate_roas(revenue, spend)

                    # Data quality check
                    if impressions < clicks:
                        logger.warning(f"Data quality issue: impressions ({impressions}) < clicks ({clicks}) for {entity_type} {entity_id}")

                    # Prepare metric record
                    metric_data = {
                        'entity_id': entity_id,
                        'entity_type': entity_type,
                        'date': insight.get('date_start'),
                        'spend': round(spend, 4),
                        'impressions': impressions,
                        'clicks': clicks,
                        'conversions': conversions,
                        'cpc': cpc,
                        'ctr': ctr,
                        'cpm': cpm,
                        'roas': roas,
                        'frequency': self.validator.safe_float(insight.get('frequency')),
                        'reach': self.validator.safe_int(insight.get('reach')),
                    }

                    # Upsert to database (handles duplicates)
                    self.supabase.table('daily_metrics').upsert(
                        metric_data,
                        on_conflict='entity_id,entity_type,date'
                    ).execute()

                except Exception as e:
                    logger.error(f"Failed to sync metric for {entity_type} {entity_id} on {insight.get('date_start')}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Failed to fetch insights for {entity_type} {entity_id}: {e}")

    def run_sync(self, days: int = None):
        """Run complete sync process."""
        if days is None:
            days = DAYS_TO_SYNC

        date_range = self.get_date_range(days)
        logger.info(f"Starting sync for date range: {date_range[0]} to {date_range[1]}")

        start_time = datetime.now()

        try:
            # Sync all entities and metrics
            campaigns_count = self.sync_campaigns(date_range)
            adsets_count = self.sync_adsets(date_range)
            ads_count = self.sync_ads(date_range)

            # Log summary
            duration = (datetime.now() - start_time).total_seconds()
            logger.info(f"""
Sync completed successfully!
Duration: {duration:.2f} seconds
Campaigns: {campaigns_count}
AdSets: {adsets_count}
Ads: {ads_count}
            """)

            return {
                'status': 'success',
                'duration_seconds': duration,
                'campaigns': campaigns_count,
                'adsets': adsets_count,
                'ads': ads_count,
            }

        except Exception as e:
            logger.error(f"Sync failed: {e}")
            raise


def main():
    """Main entry point."""
    try:
        # Validate environment variables
        required_vars = [
            'META_ACCESS_TOKEN',
            'META_AD_ACCOUNT_ID',
            'SUPABASE_URL',
            'SUPABASE_KEY'
        ]

        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

        # Run sync
        syncer = MetaToSupabase()
        result = syncer.run_sync()

        print(f"\n✅ Sync completed successfully!")
        print(f"Synced {result['campaigns']} campaigns, {result['adsets']} adsets, {result['ads']} ads")
        print(f"Duration: {result['duration_seconds']:.2f} seconds")

    except Exception as e:
        logger.error(f"Fatal error: {e}")
        print(f"\n❌ Sync failed: {e}")
        exit(1)


if __name__ == '__main__':
    main()
