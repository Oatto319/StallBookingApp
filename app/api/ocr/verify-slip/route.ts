// API Route: /api/ocr/verify-slip
// ระบบ OCR ที่ปรับปรุงแล้วสำหรับอ่านสลิปธนาคารไทย

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';

// ข้อมูลธนาคารไทย
const THAI_BANKS = {
  'กรุงเทพ': ['BBL', 'Bangkok Bank', 'กรุงเทพ'],
  'กสิกรไทย': ['KBANK', 'Kasikorn', 'K-Bank', 'กสิกรไทย'],
  'ไทยพาณิชย์': ['SCB', 'Siam Commercial', 'ไทยพาณิชย์'],
  'กรุงไทย': ['KTB', 'Krung Thai', 'กรุงไทย'],
  'กรุงศรี': ['BAY', 'Krungsri', 'กรุงศรี'],
  'ทหารไทยธนชาต': ['TTB', 'TMBThanachart', 'ทหารไทย', 'ธนชาต'],
  'ธนาคารออมสิน': ['GSB', 'Government Savings', 'ออมสิน'],
  'ธ.ก.ส.': ['BAAC', 'ธกส', 'เพื่อการเกษตร'],
  'ไทยเครดิต': ['TCRB', 'Thai Credit'],
  'ซีไอเอ็มบี': ['CIMB', 'CIMB Thai'],
  'ยูโอบี': ['UOB', 'United Overseas Bank'],
  'ทิสโก้': ['TISCO'],
  'เกียรตินาคิน': ['KKP', 'Kiatnakin'],
  'แลนด์ แอนด์ เฮ้าส์': ['LH Bank', 'LH'],
  'ไอซีบีซี': ['ICBC'],
};

// รูปแบบตัวเลขไทย
const THAI_NUMBERS: { [key: string]: string } = {
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'
};

interface OCRResult {
  success: boolean;
  amount?: number;
  bankName?: string;
  transactionDate?: string;
  transactionTime?: string;
  fromAccount?: string;
  toAccount?: string;
  referenceNo?: string;
  confidence?: number;
  rawText?: string;
  errors?: string[];
}

// ฟังก์ชันแปลงตัวเลขไทยเป็นอารบิก
function convertThaiToArabicNumbers(text: string): string {
  return text.replace(/[๐-๙]/g, (match) => THAI_NUMBERS[match] || match);
}

// ฟังก์ชันทำความสะอาดข้อความ
function cleanText(text: string): string {
  // แปลงตัวเลขไทยเป็นอารบิก
  text = convertThaiToArabicNumbers(text);
  
  // ลบอักขระพิเศษที่ไม่จำเป็น
  text = text.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s\-:.,/()\[\]]/g, ' ');
  
  // ลบช่องว่างที่เกินและทำให้เป็นบรรทัดเดียว
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

// ฟังก์ชันประมวลผลภาพให้เหมาะกับ OCR
async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      // เพิ่มขนาดภาพ (2x) เพื่อความชัดเจน
      .resize({ width: 1500, height: 2000, fit: 'inside' })
      // แปลงเป็นสีเทา
      .grayscale()
      // เพิ่มความคมชัด
      .sharpen({ sigma: 1.5 })
      // ปรับ contrast และ brightness
      .normalize()
      // ลด noise
      .median(3)
      // threshold เพื่อทำให้ข้อความชัดเจน
      .threshold(128)
      .toBuffer();
  } catch (error) {
    console.error('Image preprocessing error:', error);
    throw new Error('Failed to preprocess image');
  }
}

// ฟังก์ชันค้นหาธนาคาร
function detectBankName(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  for (const [bankName, keywords] of Object.entries(THAI_BANKS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return bankName;
      }
    }
  }
  
  return null;
}

// ฟังก์ชันแยกจำนวนเงินด้วยหลายรูปแบบ
function extractAmount(text: string): { amount: number | null; confidence: number } {
  const patterns = [
    // รูปแบบ: จำนวนเงิน 1,000.00 บาท
    /จำนวนเงิน[:\s]*([0-9,]+\.?[0-9]*)\s*บาท/i,
    // รูปแบบ: Amount: 1,000.00
    /amount[:\s]*([0-9,]+\.?[0-9]*)/i,
    // รูปแบบ: ฿1,000.00 หรือ THB 1,000.00
    /[฿THB]\s*([0-9,]+\.?[0-9]*)/i,
    // รูปแบบ: 1,000.00 บาท
    /([0-9,]+\.[0-9]{2})\s*บาท/i,
    // รูปแบบ: เลขจำนวนที่มี comma และจุดทศนิยม
    /\b([0-9]{1,3}(?:,[0-9]{3})+\.[0-9]{2})\b/,
    // รูปแบบ: เลขจำนวนที่มี comma
    /\b([0-9]{1,3}(?:,[0-9]{3})+)\b/,
    // รูปแบบ: เลขจำนวนติดกับคำว่าบาท
    /([0-9,]+)\s*บาท/i,
  ];

  let bestMatch: { amount: number; confidence: number } | null = null;

  for (let i = 0; i < patterns.length; i++) {
    const matches = text.match(patterns[i]);
    if (matches && matches[1]) {
      const amountStr = matches[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      
      if (!isNaN(amount) && amount > 0 && amount < 10000000) {
        // คำนวณ confidence ตามลำดับ pattern (pattern แรกน่าเชื่อถือที่สุด)
        const confidence = 1.0 - (i * 0.1);
        
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { amount, confidence };
        }
      }
    }
  }

  return bestMatch || { amount: null, confidence: 0 };
}

// ฟังก์ชันแยกวันที่
function extractDate(text: string): string | null {
  const patterns = [
    // DD/MM/YYYY หรือ DD-MM-YYYY
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    // YYYY-MM-DD
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
    // DD Month YYYY (Thai)
    /(\d{1,2}\s*(?:ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)\s*\d{2,4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// ฟังก์ชันแยกเวลา
function extractTime(text: string): string | null {
  const patterns = [
    // HH:MM:SS
    /(\d{1,2}:\d{2}:\d{2})/,
    // HH:MM
    /(\d{1,2}:\d{2})/,
    // น. หรือ โมง
    /(\d{1,2}\.\d{2}\s*น\.?)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// ฟังก์ชันแยกเลขบัญชี
function extractAccountNumber(text: string): { from: string | null; to: string | null } {
  const patterns = [
    // XXX-X-XXXXX-X
    /\b(\d{3}-\d{1}-\d{5}-\d{1})\b/g,
    // XXX-X-XXXXX
    /\b(\d{3}-\d{1}-\d{5})\b/g,
    // XXXXXXXXXX (10 หลัก)
    /\b(\d{10})\b/g,
  ];

  const accounts: string[] = [];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      accounts.push(match[1]);
    }
  }

  return {
    from: accounts[0] || null,
    to: accounts[1] || null,
  };
}

// ฟังก์ชันแยกเลขอ้างอิง
function extractReferenceNumber(text: string): string | null {
  const patterns = [
    /(?:ref|reference|อ้างอิง|เลขที่)[:\s]*([A-Z0-9\-]+)/i,
    /\b([A-Z]{2,}\d{8,})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// ฟังก์ชันคำนวณ confidence score
function calculateConfidence(result: Partial<OCRResult>): number {
  let score = 0;
  let maxScore = 0;

  // จำนวนเงิน (สำคัญที่สุด - 40%)
  maxScore += 40;
  if (result.amount) score += 40;

  // ธนาคาร (20%)
  maxScore += 20;
  if (result.bankName) score += 20;

  // วันที่ (15%)
  maxScore += 15;
  if (result.transactionDate) score += 15;

  // เวลา (10%)
  maxScore += 10;
  if (result.transactionTime) score += 10;

  // เลขบัญชี (10%)
  maxScore += 10;
  if (result.fromAccount || result.toAccount) score += 10;

  // เลขอ้างอิง (5%)
  maxScore += 5;
  if (result.referenceNo) score += 5;

  return maxScore > 0 ? score / maxScore : 0;
}

// ฟังก์ชันหลักสำหรับประมวลผล OCR
async function processOCR(imageBuffer: Buffer): Promise<OCRResult> {
  try {
    // 1. ประมวลผลภาพ
    console.log('Preprocessing image...');
    const processedBuffer = await preprocessImage(imageBuffer);

    // 2. ทำ OCR ด้วย Tesseract (รองรับไทย + อังกฤษ)
    console.log('Running OCR...');
    const { data } = await Tesseract.recognize(processedBuffer, 'tha+eng', {
      logger: (m) => console.log(m),
    });

    const rawText = data.text;
    console.log('Raw OCR Text:', rawText);

    // 3. ทำความสะอาดข้อความ
    const cleanedText = cleanText(rawText);
    console.log('Cleaned Text:', cleanedText);

    // 4. แยกข้อมูล
    const { amount, confidence: amountConfidence } = extractAmount(cleanedText);
    const bankName = detectBankName(cleanedText);
    const transactionDate = extractDate(cleanedText);
    const transactionTime = extractTime(cleanedText);
    const { from: fromAccount, to: toAccount } = extractAccountNumber(cleanedText);
    const referenceNo = extractReferenceNumber(cleanedText);

    // 5. สร้างผลลัพธ์
    const result: OCRResult = {
      success: amount !== null,
      amount: amount || undefined,
      bankName: bankName || undefined,
      transactionDate: transactionDate || undefined,
      transactionTime: transactionTime || undefined,
      fromAccount: fromAccount || undefined,
      toAccount: toAccount || undefined,
      referenceNo: referenceNo || undefined,
      rawText: rawText,
      confidence: 0,
      errors: [],
    };

    // 6. คำนวณ confidence
    result.confidence = calculateConfidence(result);

    // ปรับ confidence ตามความแม่นยำของจำนวนเงิน
    if (result.amount && amountConfidence) {
      result.confidence = (result.confidence + amountConfidence) / 2;
    }

    // 7. ตรวจสอบข้อผิดพลาด
    if (!result.amount) {
      result.errors?.push('ไม่พบจำนวนเงินในสลิป');
    }
    if (!result.bankName) {
      result.errors?.push('ไม่สามารถระบุธนาคารได้');
    }
    if (!result.transactionDate) {
      result.errors?.push('ไม่พบวันที่ทำรายการ');
    }

    console.log('OCR Result:', result);
    return result;

  } catch (error) {
    console.error('OCR Processing Error:', error);
    return {
      success: false,
      confidence: 0,
      errors: ['เกิดข้อผิดพลาดในการประมวลผล OCR'],
    };
  }
}

// API Handler
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('slip') as File;
    const expectedAmount = parseFloat(formData.get('expectedAmount') as string);
    const testMode = formData.get('testMode') === 'true';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // แปลงไฟล์เป็น Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // ประมวลผล OCR
    const result = await processOCR(buffer);

    // ตรวจสอบจำนวนเงิน
    if (result.amount && expectedAmount) {
      const difference = Math.abs(result.amount - expectedAmount);
      const percentDifference = (difference / expectedAmount) * 100;

      // ถ้าต่างกันมากกว่า 1% ให้เตือน
      if (percentDifference > 1) {
        result.success = false;
        result.errors?.push(
          `จำนวนเงินไม่ตรงกับยอดชำระ (ต่างกัน ${difference.toFixed(2)} บาท)`
        );
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}