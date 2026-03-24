import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uwfyjlnjipzzyeoedrad.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZnlqbG5qaXB6enllb2VkcmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDgyMjMsImV4cCI6MjA4OTg4NDIyM30.RGXMJesRuX_HnRpA7iIFKGdpDTHS25afquel_wiUZaU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ROW_ID = 'bowl_pool_2025';

// Load state from Supabase
export async function loadState() {
  const { data, error } = await supabase
    .from('pool_state')
    .select('state')
    .eq('id', ROW_ID)
    .single();
  if (error || !data) return null;
  return data.state;
}

// Save state to Supabase
export async function saveState(state) {
  const { error } = await supabase
    .from('pool_state')
    .upsert({ id: ROW_ID, state, updated_at: new Date().toISOString() });
  if (error) console.error('Supabase save error:', error);
}

// Subscribe to real-time changes
export function subscribeToState(callback) {
  return supabase
    .channel('pool_state_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'pool_state',
      filter: `id=eq.${ROW_ID}`,
    }, (payload) => {
      if (payload.new?.state) callback(payload.new.state);
    })
    .subscribe();
}
