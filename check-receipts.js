// Quick script to check receipt types in Supabase
import { createClient } from '@supabase/supabase-js';

const SB_URL = 'https://ijcxddulqsxwfaqfzmhx.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hkZHVscXN4d2ZhcWZ6bWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MjE2MjgsImV4cCI6MjA4Mzk5NzYyOH0.hQeRBk_08FHpc731rimX8KcEapIr5HrezVsJt9onow8';

const supabase = createClient(SB_URL, SB_KEY);

async function checkReceiptTypes() {
  // Get all receipts from 2025
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .gte('date', '2025-01-01')
    .lte('date', '2025-12-31')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📊 2025 Business Receipts Summary\n');
  console.log(`Total receipts: ${data.length}\n`);

  // Group by transaction type
  const typeGroups = {};
  data.forEach(receipt => {
    const type = receipt.transactionType || receipt.subcategory || 'Unknown';
    if (!typeGroups[type]) {
      typeGroups[type] = [];
    }
    typeGroups[type].push(receipt);
  });

  // Display summary
  console.log('Categories found:');
  Object.keys(typeGroups).sort().forEach(type => {
    const count = typeGroups[type].length;
    const total = typeGroups[type].reduce((sum, r) => sum + (r.total || 0), 0);
    console.log(`  ${type}: ${count} receipts, $${total.toFixed(2)}`);
  });

  console.log('\n📝 All receipts:');
  data.forEach((receipt, i) => {
    console.log(`${i + 1}. ${receipt.date} - ${receipt.companyStore} - ${receipt.transactionType || receipt.subcategory} - $${receipt.total}`);
  });
}

checkReceiptTypes();
