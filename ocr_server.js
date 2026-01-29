// ocr_server.js
import express from 'express';
import dotenv from 'dotenv';
import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables
const OCR_API_KEY = process.env.OCR_API_KEY || 'K88924135588957';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ijcxddulqsxwfaqfzmhx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Should be set in .env

const app = express();

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(__dirname)); // Serve the static files from current dir

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Initialize Supabase client if service key is provided
const supabase = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

// Receipt Text Parser
// Receipt Text Parser
function smartCategorize(text) {
  const t = text.toLowerCase();
  
  // Utilities
  if (t.match(/pg&e|electric|water|waste|fee|gas|power|utilities|att|verizon|t-mobile|comcast|xfinity|internet/)) return 'Utilities';
  
  // Marketing
  if (t.match(/google|facebook|instagram|ads|marketing|print|flyer|promo/)) return 'Marketing';
  
  // Admin / Bank
  if (t.match(/bank|fee|charge|interest|service/)) return 'Admin / Bank';
  
  // Professional
  if (t.match(/attorney|law|cpa|accounting|tax|legal|subscription|software|adobe|intuit|quickbooks/)) return 'Professional';
  
  // Travel / Auto
  if (t.match(/chevron|shell|mobil|texaco|gas station|fuel|parking|uber|lyft|flight|hotel|airbnb|travel/)) return 'Travel / Auto';
  
  // Meals
  if (t.match(/cafe|coffee|starbucks|mcdonald|burger|grill|restaurant|pho|noodle|sushi|pizza|food|kitchen|bar|dining|lunch|dinner/)) return 'Business Meals';
  
  // Supplies (Default fallback for salon)
  if (t.match(/nail|beauty|salon|supply|cosmo|prof|sally|polish|gel|acrylic|store|market|wholesale/)) return 'Supply';
  
  return 'Other'; // Default if unsure
}

function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let companyStore = null; // Will try to find first non-date/non-total line
  let total = null;
  let category = 'Other'; 
  let items = [];

  const totalPatterns = [
    /(?:total|amount|due|balance)[:\s]*\$?([\d,]+\.?\d{2})/i,
    /\$?([\d,]+\.?\d{2})[^\n]*\s*(?:total|due)/i, // Number then word "Total"
    /^total\s*\$?([\d,]+\.?\d{2})/i
  ];

  // Try to find Total (starting from bottom up)
  for (const line of [...lines].reverse()) {
    if (total !== null) break;
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        const num = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(num)) {
          total = num;
          break;
        }
      }
    }
  }
  
  // Fallback: looking for largest number if no "Total" keyword found
  if (total === null) {
      const numbers = text.match(/\d+\.\d{2}/g);
      if (numbers) {
          const validNums = numbers.map(n => parseFloat(n)).filter(n => n < 10000); // Filter out crazy OCR errors
          if (validNums.length > 0) total = Math.max(...validNums);
      }
  }

  // Date detection
  let date = null;
  // Patterns: YYYY-MM-DD, MM/DD/YYYY, DD-Mon-YYYY, etc.
  const datePatterns = [
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
    /\b(\d{1,2}-\d{1,2}-\d{2,4})\b/,
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i,
  ];

  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        date = match[1];
        // Normalize to YYYY-MM-DD if possible or leave as string
        break;
      }
    }
    if (date) break;
  }
  
  // Merchant Name Guessing (First line that isn't a date or just symbols)
  for (const line of lines) {
      if (line.length > 3 && !line.match(/\d{1,2}\/\d{1,2}/) && !line.includes('Total')) {
          companyStore = line.replace(/[^\w\s'&]/g, '').trim(); 
          break;
      }
  }

  // Items / Description - grab standard text lines
  // Filter out the total line and date line
  const descLines = lines.filter(l => 
    (!total || !l.includes(total)) && 
    (!date || !l.includes(date)) &&
    l !== companyStore &&
    l.length > 3
  );
  
  // Limit description to first 5 lines to avoid clutter
  const descText = descLines.slice(0, 5).join(', ');
  
  // Smart Categorize based on full text
  category = smartCategorize(text + " " + (companyStore || ''));

  return { 
    date: date || new Date().toLocaleDateString(), 
    companyStore: companyStore || 'Unknown Store', 
    total: total || 0, 
    transactionType: category, // Mapping this to the category dropdown
    items: descText, 
    raw_text: text 
  };
}

// OCR.space API Integration
async function ocrFromBase64(base64Data, mimeType = 'image/jpeg') {
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const formData = new URLSearchParams();
  formData.append('apikey', OCR_API_KEY);
  formData.append('language', 'eng');
  formData.append('isTable', 'true');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2');
  formData.append('base64Image', `data:${mimeType};base64,${cleanBase64}`);

  try {
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
    const data = await response.json();
    if (data.IsErroredOnProcessing) throw new Error(data.ErrorMessage?.[0] || 'OCR failed');
    if (!data.ParsedResults || data.ParsedResults.length === 0) throw new Error('No text found');
    return data.ParsedResults[0].ParsedText || '';
  } catch (error) {
    console.error('OCR API error:', error);
    throw error;
  }
}

// API Routes
app.post('/api/receipt-ocr-base64', async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const text = await ocrFromBase64(image, mimeType || 'image/jpeg');
    const parsed = parseReceiptText(text);

    // If Supabase is connected, save it
    if (supabase) {
      const { data, error } = await supabase.from('receipts').insert(parsed).select().single();
      if (error) console.warn('Supabase insert error:', error.message);
      return res.json(data || parsed);
    }

    res.json(parsed);
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001; // Run on 3001 to avoid Vite conflict
app.listen(PORT, () => {
  console.log(`🚀 OCR Backend running on http://localhost:${PORT}`);
});
