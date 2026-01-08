# Database Schema Fixes Applied

## Issues Fixed

### 1. Missing `live_shows` Table
**Problem**: The code was trying to use a `live_shows` table that doesn't exist in the Supabase database schema.

**Files affected**:
- `src/components/LivePlayer.tsx`
- `src/hooks/useLiveShows.ts` 
- `src/components/LiveStatus.tsx`

**Solution**: Modified the components to work with the existing `shows` table and simulate live status.

### 2. Type Mismatches
**Problem**: TypeScript errors due to incorrect interface definitions that expected nested `shows` objects.

**Solution**: Updated interfaces to match the actual database schema:

```typescript
// Before (incorrect)
interface LiveShow {
  id: string;
  show_id: string;
  shows: {
    name: string;
    // ...
  };
}

// After (correct)
interface LiveShow {
  id: string;
  name: string;
  // ... direct properties from shows table
}
```

### 3. Database Queries
**Problem**: Queries were trying to join with a non-existent `live_shows` table.

**Solution**: Updated to query the `shows` table directly:

```typescript
// Before
.from('live_shows')
.select(`*, shows(name, image_url)`)

// After  
.from('shows')
.select('*')
```

## Current Behavior

Since there's no actual `live_shows` table, the app now:
1. Fetches shows from the `shows` table
2. Simulates live status (first few shows appear as "live")
3. Maintains all UI functionality
4. Works with the existing database schema

## To Implement Real Live Shows

If you want actual live show functionality, you would need to either:

1. **Add a `live_shows` table** to your Supabase database:
```sql
CREATE TABLE live_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_live BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

2. **Add a `is_live` column** to the existing `shows` table:
```sql
ALTER TABLE shows ADD COLUMN is_live BOOLEAN DEFAULT false;
```

3. **Use the current simulation** (which is what's implemented now)

## Files Modified

- ✅ `src/components/LivePlayer.tsx` - Fixed type errors and database queries
- ✅ `src/hooks/useLiveShows.ts` - Updated to work with shows table
- ✅ `src/components/LiveStatus.tsx` - Fixed interface and queries
- ✅ `src/hooks/useAudioPlayer.tsx` - Added for actual audio streaming
- ✅ `src/config/streams.ts` - Created for stream configuration

All TypeScript errors have been resolved and the app should now run without database-related errors.