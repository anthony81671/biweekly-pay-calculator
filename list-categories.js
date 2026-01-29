// Simple script to list all unique subcategories
import { createClient } from '@supabase/supabase-js';

const SB_URL = 'https://ijcxddulqsxwfaqfzmhx.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hkZHVscXN4d2ZhcWZ6bWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MjE2MjgsImV4cCI6MjA4Mzk5NzYyOH0.hQeRBk_08FHpc731rimX8KcEapIr5HrezVsJt9onow8';

const supabase = createClient(SB_URL, SB_KEY);

async function listCategories() {
  const { data, error } = await supabase
    .from('receipts')
    .select('subcategory')
    .gte('date', '2025-01-01');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const categories = [...new Set(data.map(r => r.subcategory).filter(s => s))];
  
  console.log('Receipt subcategories in database:');
  categories.sort().forEach((cat, i) => {
    const count = data.filter(r => r.subcategory === cat).length;
    console.log(`${i + 1}. ${cat} (${count} receipts)`);
  });
}

listCategories();
