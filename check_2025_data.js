import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://ijcxddulqsxwfaqfzmhx.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hkZHVscXN4d2ZhcWZ6bWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MjE2MjgsImV4cCI6MjA4Mzk5NzYyOH0.hQeRBk_08FHpc731rimX8KcEapIr5HrezVsJt9onow8";

const supabase = createClient(SB_URL, SB_KEY);

async function checkData() {
    console.log("Checking data for 2025...");
    
    const startStr = "2025-01-01";
    const endStr = "2025-12-31";

    const { count, error } = await supabase
        .from("sales_records")
        .select("*", { count: 'exact', head: true }) // Count only
        .gte("entry_date", startStr)
        .lte("entry_date", endStr);

    if (error) {
        console.error("Error fetching count:", error);
        return;
    }
    console.log(`Total EXACT 2025 Records in DB: ${count}`);

    // Now fetch with higher limit to see distribution
    const { data: rows, error: err2 } = await supabase
         .from("sales_records")
         .select("entry_date")
         .gte("entry_date", startStr)
         .lte("entry_date", endStr)
         .range(0, 5000); // Fetch up to 5000
    
    if (err2) console.error(err2);
    
    // Use rows for monthly distribution
    const data = rows || [];

    const monthCounts = {};
    const months = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    // Initialize
    months.forEach(m => monthCounts[m] = 0);

    data.forEach(r => {
        const date = new Date(r.entry_date);
        // Correct for timezone if needed, but simple getMonth() on date string (if YYYY-MM-DD) parsed as UTC might be off if not handled.
        // Better: parse string manually.
        const [y, m, d] = r.entry_date.split("-").map(Number);
        const monthName = months[m - 1];
        if (monthName) monthCounts[monthName]++;
    });

    console.log("\nRecords per Month in 2025:");
    let total = 0;
    months.forEach(m => {
        console.log(`${m}: ${monthCounts[m]} records`);
        total += monthCounts[m];
    });
    console.log(`\nTotal 2025 Records: ${total}`);
}

checkData();
