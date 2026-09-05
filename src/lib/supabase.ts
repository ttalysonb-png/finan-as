import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://zvqjtkwaxxtyhfrxmmvk.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_MdSZpVGO7E3ezVOTVEdtFg_OCFdi_Zr';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
