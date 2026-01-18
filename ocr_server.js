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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(__dirname)); // Serve the static files from current dir

// Initialize Supabase client if service key is provided
const supabase = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

// Receipt Text Parser
function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let companyStore = lines[0] || null;
  let total = null;
  let transactionType = 'Expense'; // Default
  let items = [];

  const totalPatterns = [
    /total[:\s]*\$?([\d,]+\.?\d*)/i,
    /amount[:\s]*\$?([\d,]+\.?\d*)/i,
    /grand\s*total[:\s]*\$?([\d,]+\.?\d*)/i,
    /balance\s*due[:\s]*\$?([\d,]+\.?\d*)/i,
  ];

  const typePatterns = [
    { pattern: /visa|mastercard|debit|credit|amex|discover|card/i, type: 'Card' },
    { pattern: /cash|change/i, type: 'Cash' },
    { pattern: /venmo|zelle|paypal/i, type: 'Digital' }
  ];

  for (const line of [...lines].reverse()) {
    // Total detection
    if (total === null) {
      for (const pattern of totalPatterns) {
        const match = line.match(pattern);
        if (match) {
          const num = match[1].replace(',', '');
          total = parseFloat(num);
          if (!isNaN(total)) break;
        }
      }
    }
    
    // Transaction Type detection
    for (const { pattern, type } of typePatterns) {
      if (pattern.test(line)) {
        transactionType = type;
        break;
      }
    }
  }

  // Date detection
  let date = null;
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    /(\d{1,2}-\d{1,2}-\d{2,4})/,
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i,
  ];

  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        date = match[1];
        break;
      }
    }
    if (date) break;
  }

  // Simple item extraction (look for lines that seem like items - text followed by price)
  const itemPattern = /^(.+?)\s+(\d+\.\d{2})$/;
  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match && !totalPatterns.some(p => p.test(line))) {
      items.push(match[1].trim());
    }
  }

  return { 
    date, 
    companyStore, 
    total, 
    transactionType, 
    items: items.join(', '), 
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
