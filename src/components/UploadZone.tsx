import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  ShieldCheck,
  Lock,
  FileSpreadsheet,
  X
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { parse, isValid, format } from 'date-fns';
import { cn } from '../lib/utils';
import { Transaction } from '../types';
import { categorizeTransactions } from '../services/gemini';

interface UploadZoneProps {
  onUpload: (transactions: Transaction[]) => void;
  userId: string;
  onBack?: () => void;
}

export function UploadZone({ onUpload, userId, onBack }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState(1); // 1: Select, 2: Mapping, 3: Processing
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const parseFlexibleDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    // Clean the date string (sometimes banks add extra spaces or chars)
    const cleanDate = dateStr.trim().replace(/\s+/g, ' ');
    
    // Try common formats
    const formats = [
      'dd-MM-yyyy HH:mm:ss',
      'dd-MM-yyyy HH.mm:ss',
      'dd-MM-yyyy HH:mm',
      'dd-MM-yyyy HH.mm',
      'dd-MM-yyyy',
      'yyyy-MM-dd HH:mm:ss',
      'yyyy-MM-dd',
      'MM/dd/yyyy HH:mm:ss',
      'MM/dd/yyyy',
      'dd/MM/yyyy HH:mm:ss',
      'dd/MM/yyyy HH.mm',
      'dd/MM/yyyy',
    ];

    for (const fmt of formats) {
      try {
        const parsed = parse(cleanDate, fmt, new Date());
        if (isValid(parsed)) return parsed;
      } catch (e) {}
    }

    // Fallback to native Date
    const native = new Date(cleanDate.replace(/\./g, ':')); // Try replacing dots with colons for native parser
    if (isValid(native)) return native;

    return null;
  };

  const findHeaderRow = (rows: any[][]): { headerRow: string[], dataRows: any[][] } => {
    const keywords = ['date', 'description', 'amount', 'debit', 'credit', 'narration', 'particulars', 'txn', 'value'];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const hasKeywords = row.some(cell => 
        typeof cell === 'string' && 
        keywords.some(kw => cell.toLowerCase().includes(kw))
      );
      
      if (hasKeywords) {
        return {
          headerRow: row.map(cell => String(cell || '').trim()),
          dataRows: rows.slice(i + 1)
        };
      }
    }
    
    return { headerRow: [], dataRows: rows };
  };

  const processFile = useCallback(async (file: File) => {
    setSelectedFile(file);
    setUploadStep(3);
    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        let rawData: any[][] = [];
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'csv') {
          const text = e.target?.result as string;
          const result = Papa.parse(text, { header: false, skipEmptyLines: true });
          rawData = result.data as any[][];
        } else if (extension === 'xlsx' || extension === 'xls') {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        } else {
          throw new Error('Unsupported file format. Please upload CSV or XLSX.');
        }

        const { headerRow, dataRows } = findHeaderRow(rawData);
        
        if (headerRow.length === 0) {
          throw new Error('Could not find transaction headers in the file.');
        }

        // Basic mapping
        const mappedTransactions = dataRows.map(row => {
          const rowObj: any = {};
          headerRow.forEach((header, index) => {
            if (header) rowObj[header.toLowerCase()] = row[index];
          });

          const getVal = (keys: string[]) => {
            for (const key of keys) {
              const foundKey = Object.keys(rowObj).find(k => k.toLowerCase().includes(key.toLowerCase()));
              if (foundKey) return rowObj[foundKey];
            }
            return null;
          };

          const dateStr = getVal(['date', 'txn date', 'value date', 'transaction date']) || '';
          const description = getVal(['description', 'narration', 'particulars', 'txn details', 'remarks']) || '';
          const debitStr = String(getVal(['debit', 'withdrawal', 'dr']) || '0').replace(/,/g, '');
          const creditStr = String(getVal(['credit', 'deposit', 'cr']) || '0').replace(/,/g, '');
          const amountStr = String(getVal(['amount', 'value', 'txn amount']) || '0').replace(/,/g, '');
          
          const debit = parseFloat(debitStr);
          const credit = parseFloat(creditStr);
          const amountVal = parseFloat(amountStr);
          
          let amount = amountVal;
          let type: 'credit' | 'debit' = 'debit';

          if (debit > 0) {
            amount = debit;
            type = 'debit';
          } else if (credit > 0) {
            amount = credit;
            type = 'credit';
          } else if (getVal(['type'])) {
            const typeStr = String(getVal(['type'])).toLowerCase();
            type = typeStr.includes('cr') || typeStr.includes('credit') || typeStr.includes('deposit') ? 'credit' : 'debit';
          } else if (amountVal < 0) {
            amount = Math.abs(amountVal);
            type = 'debit';
          } else if (amountVal > 0) {
            type = 'credit'; // Default to credit if positive and no other info? Or debit?
            // Usually if it's just one amount column, negative is debit, positive is credit.
          }

          const parsedDate = parseFlexibleDate(String(dateStr));
          if (!parsedDate || !description) return null;

          return {
            userId,
            date: format(parsedDate, 'yyyy-MM-dd'),
            description: String(description).substring(0, 100),
            amount: Math.abs(amount),
            type,
            rawDescription: String(description),
          };
        }).filter((t): t is NonNullable<typeof t> => t !== null && t.amount > 0) as Partial<Transaction>[];

        if (mappedTransactions.length === 0) {
          throw new Error('No valid transactions found in the file.');
        }

        // Categorize using Gemini
        const enriched = await categorizeTransactions(mappedTransactions);
        onUpload(enriched);
      } catch (err: any) {
        console.error('Processing error:', err);
        setError(err.message || 'Failed to process file.');
      } finally {
        setIsProcessing(false);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }, [onUpload, userId]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Zone 1: Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-surface-card border border-glass-border flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <h2 className="text-xl font-bold text-text-primary">Upload Statement</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
          </div>
          <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Bank-Grade Security</span>
        </div>
      </div>

      {/* Zone 2: Progress Stepper */}
      <div className="flex items-center justify-between px-2">
        {[
          { step: 1, label: 'Select' },
          { step: 2, label: 'Mapping' },
          { step: 3, label: 'Process' },
        ].map((s, i) => (
          <React.Fragment key={s.step}>
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500",
                uploadStep >= s.step 
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30" 
                  : "bg-surface-raised text-text-secondary border border-glass-border"
              )}>
                {uploadStep > s.step ? <CheckCircle className="w-4 h-4" /> : s.step}
              </div>
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-wider",
                uploadStep >= s.step ? "text-brand-primary" : "text-text-secondary"
              )}>{s.label}</span>
            </div>
            {i < 2 && (
              <div className="flex-1 h-[1px] mx-2 bg-surface-raised relative overflow-hidden">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: uploadStep > s.step ? '0%' : '-100%' }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 bg-brand-primary"
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Zone 3: Interactive Drop Zone */}
      <AnimatePresence mode="wait">
        {!isProcessing ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "relative h-[200px] md:h-[260px] border-2 border-dashed rounded-[2rem] transition-all duration-500 flex flex-col items-center justify-center text-center p-6 overflow-hidden group",
              isDragging 
                ? "border-brand-primary bg-brand-primary/5 scale-[1.02]" 
                : "border-glass-border bg-surface-card hover:border-brand-primary/50"
            )}
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-32 h-32 bg-brand-primary rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-[-10%] right-[-10%] w-32 h-32 bg-brand-secondary rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            <div className="relative z-10">
              <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 mx-auto">
                <Upload className="w-7 h-7 text-brand-primary" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1">Drop your statement</h3>
              <p className="text-text-secondary text-[10px] mb-4 max-w-[200px] mx-auto">
                Drag and drop your .csv or .xlsx file here, or click to browse.
              </p>
              
              <button 
                onClick={() => document.getElementById('fileInput')?.click()}
                className="brand-gradient text-white px-6 py-2.5 rounded-xl text-[10px] font-bold shadow-lg shadow-brand-primary/20 active:scale-95 transition-all"
              >
                Select File
                <input id="fileInput" type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-[2rem] p-8 flex flex-col items-center text-center gap-6 h-[200px] md:h-[260px] justify-center"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-brand-primary/10 border-t-brand-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileSpreadsheet className="w-8 h-8 text-brand-primary animate-bounce" />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-text-primary mb-1">Analyzing Data</h3>
              <p className="text-text-secondary text-[10px]">FinSathi is categorizing your transactions using AI...</p>
            </div>

            <div className="w-full max-w-[160px] h-1.5 bg-surface-raised rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, repeat: Infinity }}
                className="h-full brand-gradient"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone 4: Security Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-3 rounded-2xl flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-[8px] font-bold text-text-secondary uppercase tracking-wider">Security</p>
            <p className="text-[10px] font-bold text-text-primary">AES-256</p>
          </div>
        </div>
        <div className="glass-card p-3 rounded-2xl flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-[8px] font-bold text-text-secondary uppercase tracking-wider">Privacy</p>
            <p className="text-[10px] font-bold text-text-primary">PII Masked</p>
          </div>
        </div>
        <div className="hidden md:flex glass-card p-3 rounded-2xl items-center gap-2">
          <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <p className="text-[8px] font-bold text-text-secondary uppercase tracking-wider">Compliance</p>
            <p className="text-[10px] font-bold text-text-primary">DPDP</p>
          </div>
        </div>
        <div className="hidden md:flex glass-card p-3 rounded-2xl items-center gap-2">
          <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-[8px] font-bold text-text-secondary uppercase tracking-wider">Cloud</p>
            <p className="text-[10px] font-bold text-text-primary">Secure</p>
          </div>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-3 text-red-500 text-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-bold">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
