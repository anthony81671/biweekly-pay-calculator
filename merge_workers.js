
import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://ijcxddulqsxwfaqfzmhx.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hkZHVscXN4d2ZhcWZ6bWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MjE2MjgsImV4cCI6MjA4Mzk5NzYyOH0.hQeRBk_08FHpc731rimX8KcEapIr5HrezVsJt9onow8";
const supabase = createClient(SB_URL, SB_KEY);

async function mergeWorkers(oldName, newName) {
    console.log(`Merging ${oldName} into ${newName}...`);

    // Fetch all records for the old name
    const { data: oldRecords, error: fetchError } = await supabase
        .from('sales_records')
        .select('*')
        .eq('worker_name', oldName);

    if (fetchError) {
        console.error(`Error fetching records for ${oldName}:`, fetchError);
        return;
    }

    console.log(`Found ${oldRecords.length} records for ${oldName}`);

    for (const record of oldRecords) {
        const { entry_date, amount, discount, loyalty_discount } = record;

        // Check if record for new name exists on this date
        const { data: existingNew, error: checkError } = await supabase
            .from('sales_records')
            .select('*')
            .eq('entry_date', entry_date)
            .eq('worker_name', newName)
            .single();

        if (existingNew) {
            console.log(`Merging record for ${entry_date}`);
            // Update existing new record with sum of amounts
            const newAmount = (parseFloat(existingNew.amount) || 0) + (parseFloat(amount) || 0);
            
            const { error: updateError } = await supabase
                .from('sales_records')
                .update({ amount: newAmount })
                .eq('id', existingNew.id);

            if (updateError) {
                console.error(`Error updating record for ${newName} on ${entry_date}:`, updateError);
            } else {
                // Delete old record
                const { error: deleteError } = await supabase
                    .from('sales_records')
                    .delete()
                    .eq('id', record.id);
                
                if (deleteError) console.error(`Error deleting old record for ${oldName} on ${entry_date}:`, deleteError);
            }
        } else {
            // Just rename the record
            console.log(`Renaming record for ${entry_date}`);
            const { error: renameError } = await supabase
                .from('sales_records')
                .update({ worker_name: newName })
                .eq('id', record.id);

            if (renameError) {
                console.error(`Error renaming record for ${oldName} on ${entry_date}:`, renameError);
            }
        }
    }
}

async function start() {
    await mergeWorkers('Tuyen', 'Tuyen (Bella)');
    await mergeWorkers('ThuyLee', 'Thuy (Lee)');
    console.log("Merge complete.");
    process.exit(0);
}

start();
