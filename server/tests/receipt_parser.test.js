import { describe, it, expect } from 'vitest';
import { parseReceiptText } from '../src/services/receiptParser.js';

describe('Receipt OCR Parser Unit Tests', () => {
  it('should parse restaurant receipt with total, merchant, date, and category', () => {
    const rawOcr = `
      THE BLUE BISTRO & CAFE
      12 Brigade Road, Bangalore
      GSTIN: 29AABCU9603R1ZM
      Date: 15/10/2026   Time: 20:30
      ---------------------------------
      1x Grilled Chicken Pasta    ₹ 420.00
      2x Cappuccino              ₹ 360.00
      1x Tiramisu                ₹ 280.00
      ---------------------------------
      Sub Total:                 ₹ 1060.00
      CGST (2.5%):                 ₹ 26.50
      SGST (2.5%):                 ₹ 26.50
      GRAND TOTAL:               ₹ 1113.00
      ---------------------------------
      Thank you for visiting!
    `;

    const parsed = parseReceiptText(rawOcr);

    expect(parsed.description).toContain('THE BLUE BISTRO & CAFE');
    expect(parsed.amountPaise).toBe(111300); // 1113.00 * 100
    expect(parsed.amountRupees).toBe(1113);
    expect(parsed.expenseDate).toBe('2026-10-15');
    expect(parsed.category).toBe('Food');
  });

  it('should parse supermarket receipt with Groceries category', () => {
    const rawOcr = `
      NATURE'S BASKET SUPERMARKET
      Store #42, Indiranagar
      Bill Date: 2026-09-28
      Item: Organic Almond Milk   180.00
      Item: Whole Wheat Bread      65.00
      Item: Fresh Apples          210.00
      TOTAL AMOUNT: Rs. 455.00
      PAID VIA UPI
    `;

    const parsed = parseReceiptText(rawOcr);

    expect(parsed.description).toContain("NATURE'S BASKET SUPERMARKET");
    expect(parsed.amountPaise).toBe(45500);
    expect(parsed.amountRupees).toBe(455);
    expect(parsed.expenseDate).toBe('2026-09-28');
    expect(parsed.category).toBe('Groceries');
  });

  it('should parse fuel / taxi receipt with Travel category', () => {
    const rawOcr = `
      UBER TRIP RECEIPT
      Date: 04/11/2026
      Driver: Ramesh K
      Trip Fare: ₹ 640.00
      Toll Charges: ₹ 80.00
      NET PAYABLE: ₹ 720.00
    `;

    const parsed = parseReceiptText(rawOcr);

    expect(parsed.description).toContain('UBER TRIP RECEIPT');
    expect(parsed.amountPaise).toBe(72000);
    expect(parsed.amountRupees).toBe(720);
    expect(parsed.expenseDate).toBe('2026-11-04');
    expect(parsed.category).toBe('Travel');
  });

  it('should gracefully handle empty or noisy text', () => {
    const parsed = parseReceiptText('...!!*** 12345');
    expect(parsed.description).toBeDefined();
    expect(parsed.amountPaise).toBe(0);
    expect(parsed.expenseDate).toBeDefined();
  });
});
