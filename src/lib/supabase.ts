import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  'https://ihhhjwtgfamjuczaqqwn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGhqd3RnZmFtanVjemFxcXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTA2ODgsImV4cCI6MjA5NTU2NjY4OH0.PIKDUY--lWbhAPiVd7ltpJFG2d2O9bvVgSO-mJo15Xo'
)
