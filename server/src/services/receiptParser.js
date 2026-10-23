/**
 * Parse raw OCR text extracted from receipts into structured fields:
 * - Merchant Description
 * - Total Amount (Rupees and integer Paise)
 * - Expense Date
 * - Predicted Category
 */
export function parseReceiptText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      description: 'Scanned Receipt',
      amountPaise: 0,
      amountRupees: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      category: 'Other',
      rawText: '',
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Extract Merchant Description
  // Typically found in the first few non-noise lines
  let merchant = '';
  const noiseKeywords = [
    'tax invoice',
    'invoice',
    'cash receipt',
    'receipt',
    'bill',
    'welcome',
    'gstin',
    'fssai',
    'tel',
    'phone',
    'date',
    'time',
    'order',
    'table',
    'customer',
  ];

  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const isNoise = noiseKeywords.some((kw) => lower.startsWith(kw) || lower === kw);
    const hasEnoughLetters = (line.match(/[a-zA-Z]/g) || []).length >= 3;
    const isOnlyNumbersOrSymbols = /^[\d\s.,:;/#\-+*()₹$]+$/.test(line);

    if (!isNoise && hasEnoughLetters && !isOnlyNumbersOrSymbols) {
      // Clean up common OCR artifacts
      merchant = line
        .replace(/^[#*•\-_|~]+\s*/, '')
        .replace(/\s*[#*•\-_|~]+$/, '')
        .trim();
      if (merchant.length > 50) {
        merchant = merchant.substring(0, 50).trim();
      }
      break;
    }
  }

  if (!merchant) {
    merchant = 'Scanned Expense';
  }

  // 2. Extract Total Amount
  // Strategy: Scan lines for total keywords, or find largest currency / decimal figure
  let amountRupees = 0;

  // Patterns for explicit totals: "TOTAL : 450.00", "Grand Total: 1,250", "Net Payable ₹850.50"
  const totalRegexes = [
    /(?:grand\s*total|net\s*payable|final\s*amount|total\s*amount|bill\s*total|amount\s*due|total)\s*[:=-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    /(?:paid\s*amount|paid|sub\s*total)\s*[:=-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    /(?:rs\.?|inr|₹)\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
  ];

  for (const regex of totalRegexes) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(regex);
      if (match && match[1]) {
        const cleanedStr = match[1].replace(/,/g, '');
        const val = parseFloat(cleanedStr);
        if (!isNaN(val) && val > 0 && val < 10000000) {
          amountRupees = val;
          break;
        }
      }
    }
    if (amountRupees > 0) break;
  }

  // Fallback: If no keyword total found, scan for any valid currency number in text
  if (amountRupees === 0) {
    const generalAmounts = [];
    const numRegex = /(?:₹|rs\.?)?\s*([0-9]+(?:\.[0-9]{2}))\b/gi;
    let match;
    while ((match = numRegex.exec(rawText)) !== null) {
      const num = parseFloat(match[1]);
      if (!isNaN(num) && num > 0 && num < 10000000) {
        generalAmounts.push(num);
      }
    }
    if (generalAmounts.length > 0) {
      // Pick the max amount, as grand total is generally the largest line item
      amountRupees = Math.max(...generalAmounts);
    }
  }

  const amountPaise = Math.round(amountRupees * 100);

  // 3. Extract Date
  let expenseDate = new Date().toISOString().split('T')[0];

  // Try parsing formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const datePatterns = [
    /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\b/, // 24/10/2026 or 24-10-2026
    /\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b/, // 2026-10-24
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i,
  ];

  for (const pattern of datePatterns) {
    const match = rawText.match(pattern);
    if (match) {
      if (match[3] && match[3].length === 4 && match[1].length <= 2 && match[2].length <= 2) {
        // DD/MM/YYYY
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        const parsed = new Date(`${year}-${month}-${day}`);
        if (!isNaN(parsed.getTime())) {
          expenseDate = `${year}-${month}-${day}`;
          break;
        }
      } else if (match[1] && match[1].length === 4) {
        // YYYY-MM-DD
        const year = match[1];
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        const parsed = new Date(`${year}-${month}-${day}`);
        if (!isNaN(parsed.getTime())) {
          expenseDate = `${year}-${month}-${day}`;
          break;
        }
      }
    }
  }

  // 4. Predict Category
  let category = 'Other';
  const lowerText = rawText.toLowerCase();

  const categoryKeywords = {
    Food: ['restaurant', 'cafe', 'coffee', 'kitchen', 'burger', 'pizza', 'diner', 'dining', 'bistro', 'bakery', 'tea', 'swiggy', 'zomato', 'food', 'biryani', 'meal', 'bar', 'pub'],
    Groceries: ['supermarket', 'mart', 'grocery', 'bazaar', 'spices', 'vegetable', 'fruit', 'hypermarket', 'store', 'kirana', 'dairy', 'milk'],
    Travel: ['uber', 'ola', 'cab', 'taxi', 'petrol', 'diesel', 'fuel', 'railway', 'irctc', 'flight', 'airline', 'toll', 'bus', 'metro'],
    Accommodation: ['hotel', 'resort', 'inn', 'stay', 'lodge', 'airbnb', 'room'],
    Shopping: ['retail', 'clothing', 'fashion', 'apparels', 'zara', 'h&m', 'decathlon', 'mall', 'footwear', 'electronics'],
    Rent: ['rent', 'landlord', 'flat rent', 'apartment rent', 'lease'],
    Utilities: ['electricity', 'bescom', 'water', 'broadband', 'wifi', 'internet', 'gas', 'cylinder', 'recharge'],
    Entertainment: ['cinema', 'movie', 'theater', 'netflix', 'spotify', 'game', 'bowling', 'concert'],
  };

  for (const [cat, words] of Object.entries(categoryKeywords)) {
    if (words.some((word) => lowerText.includes(word))) {
      category = cat;
      break;
    }
  }

  return {
    description: merchant,
    amountPaise,
    amountRupees: Number(amountRupees.toFixed(2)),
    expenseDate,
    category,
    rawText,
  };
}
