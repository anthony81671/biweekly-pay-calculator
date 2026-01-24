// Find receipt types that are missing from budget categories
import { createClient } from '@supabase/supabase-js';

const SB_URL = 'https://ijcxddulqsxwfaqfzmhx.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqY3hkZHVscXN4d2ZhcWZ6bWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MjE2MjgsImV4cCI6MjA4Mzk5NzYyOH0.hQeRBk_08FHpc731rimX8KcEapIr5HrezVsJt9onow8';

const supabase = createClient(SB_URL, SB_KEY);

// Budget categories from business-budget.html
const budgetCategories = {
  'Utilities': ['Electricity & Gas', 'Water & Waste', 'Internet & Phone'],
  'Marketing': ['Advertising', 'Software / Subscriptions'],
  'Admin / Bank': ['Merchant Fees', 'Bank Service Charges'],
  'Professional': ['Accounting & Legal', 'Dues & Subscriptions', 'Intuit Quickbooks'],
  'Travel / Auto': ['Business Meals', 'Auto / Mileage'],
  'Income Sources': ['Venmo', 'Zelle', 'Credit Card Deposit']
};

// Flatten all budget subcategories
const allBudgetSubcategories = [];
Object.values(budgetCategories).forEach(subs => {
  allBudgetSubcategories.push(...subs);
});

async function findMissingCategories() {
  const { data, error } = await supabase
    .from('receipts')
    .select('subcategory')
    .gte('date', '2025-01-01')
    .lte('date', '2025-12-31');

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Get unique subcategories from receipts
  const receiptSubcategories = [...new Set(data.map(r => r.subcategory).filter(s => s))];

  console.log('\n📊 Budget Category Analysis\n');
  console.log('Budget has these subcategories:');
  allBudgetSubcategories.sort().forEach(cat => console.log(`  ✅ ${cat}`));

  console.log('\n\nReceipts have these subcategories:');
  receiptSubcategories.sort().forEach(cat => console.log(`  📝 ${cat}`));

  // Find missing categories
  const missingFromBudget = receiptSubcategories.filter(cat => !allBudgetSubcategories.includes(cat));
  const missingFromReceipts = allBudgetSubcategories.filter(cat => !receiptSubcategories.includes(cat));

  console.log('\n\n⚠️  MISSING FROM BUDGET (in receipts but not in budget):');
  if (missingFromBudget.length === 0) {
    console.log('  None - all receipt types are in the budget!');
  } else {
    missingFromBudget.sort().forEach(cat => {
      const count = data.filter(r => r.subcategory === cat).length;
      console.log(`  ❌ ${cat} (${count} receipts)`);
    });
  }

  console.log('\n\n📋 NOT USED YET (in budget but no receipts):');
  if (missingFromReceipts.length === 0) {
    console.log('  None - all budget categories have receipts!');
  } else {
    missingFromReceipts.sort().forEach(cat => console.log(`  ⚪ ${cat}`));
  }
}

findMissingCategories();
