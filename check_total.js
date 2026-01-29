
import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://ijcxddulqsxwfaqfzmhx.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hkZHVscXN4d2ZhcWZ6bWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MjE2MjgsImV4cCI6MjA4Mzk5NzYyOH0.hQeRBk_08FHpc731rimX8KcEapIr5HrezVsJt9onow8";

const supabase = createClient(SB_URL, SB_KEY);

async function checkTotal() {
    const { count, error } = await supabase
        .from("sales_records")
        .select("*", { count: 'exact', head: true });

    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log(`Total Records in DB: ${count}`);
    
    // Also check 2026 count specifically
    const { count: count26 } = await supabase
        .from("sales_records")
        .select("*", { count: 'exact', head: true })
        .gte("entry_date", "2026-01-01");
        
    console.log(`Total 2026 Records: ${count26}`);
}

checkTotal();
