# Meta Ads to Supabase Sync Script

Simple Python script to pull Meta advertising data and load it into Supabase with clean, validated data.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

3. **Set up Supabase database:**
   - Go to your Supabase project
   - Open SQL Editor
   - Run the contents of `supabase_schema.sql`

4. **Get Meta API credentials:**
   - Access Token: https://developers.facebook.com/tools/explorer/
   - Ad Account ID: Format is `act_1234567890`

## Usage

Run the script:
```bash
python meta_to_supabase.py
```

This will:
- Sync campaigns, adsets, and ads metadata
- Pull daily metrics for the last 7 days (configurable via `DAYS_TO_SYNC`)
- Calculate CTR, CPC, CPM, ROAS with safe division
- Validate data before insertion
- Handle duplicates with upsert logic
- Log progress to console and log file

## Data Integrity Features

✅ **Type validation** - All data types checked and coerced safely
✅ **Safe division** - Prevents division by zero errors
✅ **Data quality checks** - Validates logical constraints (impressions >= clicks)
✅ **Deduplication** - Unique constraint on (entity_id, entity_type, date)
✅ **Error handling** - Individual entity failures don't crash the entire sync
✅ **Logging** - Detailed logs for debugging and monitoring

## Configuration

Edit `.env` to customize:
- `DAYS_TO_SYNC`: How many days of historical data to pull (default: 7)
- `META_API_VERSION`: Meta API version (default: v18.0)

## Output

The script creates:
- Daily log file: `meta_sync_YYYYMMDD.log`
- Console output with progress and summary

## Database Schema

The script uses the following tables in Supabase:
- `campaigns` - Campaign metadata
- `adsets` - AdSet metadata
- `ads` - Ad metadata and creative info
- `daily_metrics` - Daily performance metrics (deduplicated by entity_id, entity_type, date)

All tables have proper indexes, foreign keys, and constraints to ensure data integrity.
