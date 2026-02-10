
import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://ijcxddulqsxwfaqfzmhx.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hkZHVscXN4d2ZhcWZ6bWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MjE2MjgsImV4cCI6MjA4Mzk5NzYyOH0.hQeRBk_08FHpc731rimX8KcEapIr5HrezVsJt9onow8";
const supabase = createClient(SB_URL, SB_KEY);

async function renameWorkers() {
    console.log("Renaming Workers in Supabase...");

    // Rename Tuyen to Tuyen (Bella)
    const { data: data1, error: error1 } = await supabase
        .from('sales_records')
        .update({ worker_name: 'Tuyen (Bella)' })
        .eq('worker_name', 'Tuyen');

    if (error1) {
        console.error("Error renaming Tuyen:", error1);
    } else {
        console.log("Renamed Tuyen to Tuyen (Bella)");
    }

    // Rename ThuyLee to Thuy (Lee)
    const { data: data2, error: error2 } = await supabase
        .from('sales_records')
        .update({ worker_name: 'Thuy (Lee)' })
        .eq('worker_name', 'ThuyLee');

    if (error2) {
        console.error("Error renaming ThuyLee:", error2);
    } else {
        console.log("Renamed ThuyLee to Thuy (Lee)");
    }

    console.log("Rename complete.");
    process.exit(0);
}

renameWorkers();
