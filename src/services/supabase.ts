import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zbmklbclzyeupcirjfyz.supabase.co';
const supabaseKey = 'sb_publishable_ee_Gfb1uwteFebjMeyfzhA_d_TJPuxv';

export const supabase = createClient(supabaseUrl, supabaseKey);
