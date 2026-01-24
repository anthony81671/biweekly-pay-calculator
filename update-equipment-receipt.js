// Script to update equipment receipt to use new "Salon Equipments" subcategory
import { createClient } from '@supabase/supabase-js';

const SB_URL = 'https://ijcxddulqsxwfaqfzmhx.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hkZHVscXN4d2ZhcWZ6bWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MjE2MjgsImV4cCI6MjA4Mzk5NzYyOH0.hQeRBk_08FHpc731rimX8KcEapIr5HrezVsJt9onow8';

const supabase = createClient(SB_URL, SB_KEY);

async function updateEquipmentReceipt() {
  console.log('Searching for equipment receipt...');
  
  // Find the receipt with equipment in items
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('date', '2025-11-26')
    .eq('total', 75);

  if (error) {
    console.error('Error finding receipt:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No equipment receipt found');
    return;
  }

  const receipt = data[0];
  console.log('Found receipt:', receipt);

  // Update the subcategory to "Salon Equipments"
  const { error: updateError } = await supabase
    .from('receipts')
    .update({ 
      subcategory: 'Salon Equipments',
      transactiontype: 'Salon Equipments'
    })
    .eq('id', receipt.id);

  if (updateError) {
    console.error('Error updating receipt:', updateError);
    return;
  }

  console.log('✓ Successfully updated receipt to use "Salon Equipments" category');
  console.log('Receipt ID:', receipt.id);
  console.log('Date:', receipt.date);
  console.log('Amount: $' + receipt.total);
}

updateEquipmentReceipt();
