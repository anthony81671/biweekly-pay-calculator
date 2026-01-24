// Script to search receipts by description
import { createClient } from '@supabase/supabase-js';

const SB_URL = 'https://ijcxddulqsxwfaqfzmhx.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hkZHVscXN4d2ZhcWZ6bWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MjE2MjgsImV4cCI6MjA4Mzk5NzYyOH0.hQeRBk_08FHpc731rimX8KcEapIr5HrezVsJt9onow8';

const supabase = createClient(SB_URL, SB_KEY);

async function searchReceipts(searchTerm) {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Filter receipts that contain the search term in description or items
  const matches = data.filter(receipt => {
    const description = (receipt.description || '').toLowerCase();
    const items = (receipt.items || '').toLowerCase();
    const subcategory = (receipt.subcategory || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return description.includes(search) || 
           items.includes(search) || 
           subcategory.includes(search);
  });

  console.log(`\n=== Search Results for "${searchTerm}" ===`);
  console.log(`Found ${matches.length} matching receipt(s)\n`);

  matches.forEach((receipt, i) => {
    console.log(`${i + 1}. Date: ${receipt.date}`);
    console.log(`   Store: ${receipt.store_name || 'N/A'}`);
    console.log(`   Amount: $${receipt.total || '0.00'}`);
    console.log(`   Category: ${receipt.category || 'N/A'}`);
    console.log(`   Subcategory: ${receipt.subcategory || 'N/A'}`);
    console.log(`   Description: ${receipt.description || 'N/A'}`);
    if (receipt.items) {
      console.log(`   Items: ${receipt.items}`);
    }
    console.log('');
  });

  return matches;
}

// Get search term from command line argument
const searchTerm = process.argv[2] || 'equipment';
searchReceipts(searchTerm);
