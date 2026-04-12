/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  FileText, 
  FileImage, 
  Upload, 
  Download, 
  X, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  FileUp,
  Settings2,
  Zap,
  Coins,
  ShoppingCart,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Toaster, toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  convertPdfToText, 
  convertPdfToImages, 
  convertTextToImage,
  convertTextToPdf,
  convertWordToText 
} from '@/lib/converter';

type FileType = 'pdf' | 'text' | 'word' | 'unknown';
type OutputFormat = 'text' | 'jpeg' | 'pdf';

interface FileState {
  file: File;
  type: FileType;
  id: string;
}

export default function App() {
  const [fileState, setFileState] = useState<FileState | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('text');
  const [result, setResult] = useState<{ urls: string[], type: OutputFormat } | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [showPricing, setShowPricing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user credits and pricing on mount
  React.useEffect(() => {
    fetchCredits();
    fetchPricing();

    // Check for payment status in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      toast.success('Payment successful! Your credits will be updated shortly.');
      // Remove params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh credits after a short delay to allow ITN to process
      setTimeout(fetchCredits, 2000);
    } else if (params.get('payment') === 'cancel') {
      toast.error('Payment cancelled.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/user/credits');
      if (!res.ok) {
        throw new Error('API unavailable');
      }
      const data = await res.json();
      setCredits(data.credits);
    } catch (error) {
      console.error('Failed to fetch credits, using demo mode:', error);
      // Fallback for static environments/Vercel where the Express backend isn't running
      setCredits(50); 
    }
  };

  const fetchPricing = async () => {
    try {
      const res = await fetch('/api/pricing');
      if (!res.ok) {
        throw new Error('API unavailable');
      }
      const data = await res.json();
      setPricing(data);
    } catch (error) {
      console.error('Failed to fetch pricing, using demo mode:', error);
      // Fallback for static environments
      setPricing({
        currency: "ZAR",
        costPerConversion: 1,
        tiers: [
          { id: "starter", name: "Starter", credits: 10, price: 50.00, description: "Perfect for occasional conversions" },
          { id: "pro", name: "Professional", credits: 50, price: 200.00, description: "Best for power users", popular: true },
          { id: "enterprise", name: "Enterprise", credits: 250, price: 750.00, description: "For businesses" }
        ]
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    let type: FileType = 'unknown';
    const fileName = file.name.toLowerCase();
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      type = 'pdf';
    } else if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
      type = 'text';
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      file.type === 'application/msword' ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      type = 'word';
    }
    
    if (type === 'unknown') {
      toast.error(`Unsupported file type: ${file.type || 'unknown'}. Please upload a PDF, Text, or Word file.`);
      return;
    }

    setFileState({
      file,
      type,
      id: Math.random().toString(36).substring(7)
    });
    setResult(null);
    setProgress(0);
    
    // Set default output based on input
    if (type === 'text') setOutputFormat('jpeg');
    else if (type === 'word') setOutputFormat('pdf');
    else setOutputFormat('text');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setFileState(null);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startConversion = async () => {
    if (!fileState) return;
    
    if (credits !== null && credits <= 0) {
      toast.error('You have run out of credits. Please purchase more to continue.');
      setShowPricing(true);
      return;
    }

    setIsConverting(true);
    setProgress(10);
    
    try {
      // Deduct credit first
      const deductRes = await fetch('/api/user/deduct', { method: 'POST' });
      if (deductRes.ok) {
        const deductData = await deductRes.json();
        setCredits(deductData.credits);
      } else {
        console.warn('Deduction API unavailable, proceeding in demo mode');
        setCredits(prev => prev !== null ? prev - 1 : null);
      }

      let urls: string[] = [];
      
      if (fileState.type === 'pdf') {
        if (outputFormat === 'text') {
          const text = await convertPdfToText(fileState.file);
          const blob = new Blob([text], { type: 'text/plain' });
          urls = [URL.createObjectURL(blob)];
        } else if (outputFormat === 'jpeg') {
          const blobs = await convertPdfToImages(fileState.file);
          urls = blobs.map(blob => URL.createObjectURL(blob));
        } else {
          // PDF to PDF (pass-through)
          urls = [URL.createObjectURL(fileState.file)];
        }
      } else if (fileState.type === 'text') {
        const text = await fileState.file.text();
        if (outputFormat === 'jpeg') {
          const blob = await convertTextToImage(text, fileState.file.name);
          urls = [URL.createObjectURL(blob)];
        } else if (outputFormat === 'pdf') {
          const blob = await convertTextToPdf(text, fileState.file.name);
          urls = [URL.createObjectURL(blob)];
        }
      } else if (fileState.type === 'word') {
        const text = await convertWordToText(fileState.file);
        if (outputFormat === 'text') {
          const blob = new Blob([text], { type: 'text/plain' });
          urls = [URL.createObjectURL(blob)];
        } else if (outputFormat === 'jpeg') {
          const blob = await convertTextToImage(text, fileState.file.name);
          urls = [URL.createObjectURL(blob)];
        } else if (outputFormat === 'pdf') {
          const blob = await convertTextToPdf(text, fileState.file.name);
          urls = [URL.createObjectURL(blob)];
        }
      }

      setProgress(100);
      setTimeout(() => {
        setResult({ urls, type: outputFormat });
        setIsConverting(false);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success('Conversion complete!');
      }, 500);
      
    } catch (error: any) {
      console.error('Conversion error:', error);
      const message = error instanceof Error ? error.message : 'Conversion failed. Please try again.';
      toast.error(message);
      setIsConverting(false);
      setProgress(0);
    }
  };

  const downloadResult = (url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    let extension = 'txt';
    if (result?.type === 'jpeg') extension = 'jpg';
    else if (result?.type === 'pdf') extension = 'pdf';
    
    const originalName = fileState?.file.name.split('.')[0] || 'converted';
    a.download = `${originalName}_1.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    result?.urls.forEach((url, i) => {
      const a = document.createElement('a');
      a.href = url;
      let extension = 'txt';
      if (result?.type === 'jpeg') extension = 'jpg';
      else if (result?.type === 'pdf') extension = 'pdf';
      const originalName = fileState?.file.name.split('.')[0] || 'converted';
      a.download = `${originalName}_${i + 1}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  const handlePurchase = async (tierId: string) => {
    try {
      const res = await fetch('/api/payfast/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId })
      });
      
      if (!res.ok) {
        throw new Error('Checkout API unavailable');
      }

      const { url, data } = await res.json();
      
      // Create a form and submit it to PayFast
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = url;
      
      Object.keys(data).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.info('Payment integration requires a live backend. In this demo, you can continue testing with your existing credits!');
      setShowPricing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans text-slate-900 selection:bg-primary/10">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 overflow-hidden shrink-0 flex items-center justify-center">
              <img 
                src="https://storage.googleapis.com/m-ai-studio-public-assets/q-bit-logo-full.png" 
                alt="Q-bit Logo" 
                className="h-full w-auto object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="w-6 h-6 text-primary fill-current"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 2-2 10h3L11 22l2-10h-3L13 2z"/></svg></div><span class="font-bold text-2xl tracking-tighter text-slate-900 ml-2">Q-bit</span>';
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <nav className="flex items-center gap-4 md:gap-6 text-sm font-medium text-slate-500">
              <button onClick={() => setShowPricing(true)} className="hover:text-primary transition-colors">Pricing</button>
              <a href="#" className="hidden sm:inline hover:text-primary transition-colors">Privacy</a>
            </nav>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all",
              credits === null ? "bg-slate-100 text-slate-400 animate-pulse" : "bg-amber-50 border border-amber-100 text-amber-700"
            )}>
              <Coins className="w-4 h-4" />
              {credits !== null ? `${credits} Credits` : 'Loading...'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-[400px] mx-auto mb-12 px-4"
          >
            <img 
              src="https://storage.googleapis.com/m-ai-studio-public-assets/q-bit-logo-full.png" 
              alt="Q-bit Logo" 
              className="w-full h-auto object-contain drop-shadow-xl"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="w-24 h-24 mx-auto mb-8 rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500 bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-12 h-12 text-white fill-current drop-shadow-lg"><path d="m13 2-2 10h3L11 22l2-10h-3L13 2z"/></svg></div>';
              }}
            />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Convert documents <br />
            <span className="text-slate-400">instantly in your browser.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 text-lg max-w-xl mx-auto"
          >
            Secure, client-side conversion. Your files never leave your device.
            Supports PDF to Text, PDF to JPEG, Text to JPEG, and Word to Text/JPEG.
          </motion.p>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileUp className="w-5 h-5 text-primary" />
                Upload Document
              </CardTitle>
              {fileState && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                  {fileState.type.toUpperCase()}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {!fileState ? (
              <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-all group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.txt,.doc,.docx"
                />
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-medium text-lg mb-1">Click or drag file here</h3>
                <p className="text-slate-400 text-sm">PDF, TXT, or Word files up to 20MB</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {fileState.type === 'pdf' ? (
                      <FileText className="w-6 h-6 text-red-500" />
                    ) : (
                      <FileText className="w-6 h-6 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fileState.file.name}</p>
                    <p className="text-xs text-slate-400">{(fileState.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearFile} className="text-slate-400 hover:text-red-500">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {!result && !isConverting && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                      <Settings2 className="w-4 h-4" />
                      Conversion Settings
                    </div>
                    
                    <Tabs 
                      value={outputFormat} 
                      onValueChange={(v) => setOutputFormat(v as OutputFormat)}
                      className="w-full"
                    >
                      <TabsList className="grid grid-cols-3 w-full bg-slate-100 p-1 rounded-xl">
                        <TabsTrigger 
                          value="text" 
                          disabled={fileState.type === 'text'}
                          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Text
                        </TabsTrigger>
                        <TabsTrigger 
                          value="jpeg"
                          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          <FileImage className="w-4 h-4 mr-2" />
                          JPEG
                        </TabsTrigger>
                        <TabsTrigger 
                          value="pdf"
                          disabled={fileState.type === 'pdf'}
                          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          PDF
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </motion.div>
                )}

                {isConverting && (
                  <div className="space-y-3 py-4">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        Converting...
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-slate-100" />
                  </div>
                )}

                {result && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-green-50 border border-green-100 rounded-2xl text-center"
                  >
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="font-bold text-xl text-green-900 mb-1">Ready for Download!</h3>
                    <p className="text-green-700 text-sm mb-6">
                      Your file has been converted to {result.type.toUpperCase()}.
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-3">
                      {result.urls.length === 1 ? (
                        <Button onClick={() => downloadResult(result.urls[0], 0)} className="rounded-full px-8">
                          <Download className="w-4 h-4 mr-2" />
                          Download Q-bit badge
                        </Button>
                      ) : (
                        <Button onClick={downloadAll} className="rounded-full px-8">
                          <Download className="w-4 h-4 mr-2" />
                          Download All ({result.urls.length} Q-bit badges)
                        </Button>
                      )}
                      <Button variant="outline" onClick={clearFile} className="rounded-full">
                        Convert Another
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </CardContent>
          
          {!result && !isConverting && fileState && (
            <CardFooter className="bg-slate-50/50 border-t p-6">
              <Button 
                onClick={startConversion} 
                className="w-full h-12 rounded-xl text-lg font-semibold shadow-lg shadow-primary/20"
              >
                Start Conversion
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Pricing Modal Overlay */}
        <AnimatePresence>
          {showPricing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowPricing(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8 md:p-12">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">Simple, transparent pricing</h2>
                      <p className="text-slate-500 mt-2">Choose the plan that's right for you.</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowPricing(false)} className="rounded-full">
                      <X className="w-6 h-6" />
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {pricing?.tiers.map((tier: any) => (
                      <div 
                        key={tier.id} 
                        className={cn(
                          "relative p-6 rounded-2xl border-2 transition-all hover:shadow-lg",
                          tier.popular ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                        )}
                      >
                        {tier.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                            Most Popular
                          </div>
                        )}
                        <h3 className="font-bold text-xl mb-1">{tier.name}</h3>
                        <p className="text-slate-500 text-sm mb-4 h-10">{tier.description}</p>
                        <div className="flex items-baseline gap-1 mb-6">
                          <span className="text-3xl font-bold">${tier.price}</span>
                          <span className="text-slate-400 text-sm">/ {tier.credits} credits</span>
                        </div>
                        <Button 
                          className={cn("w-full rounded-xl", tier.popular ? "bg-primary" : "bg-slate-900")}
                          onClick={() => handlePurchase(tier.id)}
                        >
                          Get Started
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 p-6 bg-slate-50 rounded-2xl flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                      <Info className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">How credits work</h4>
                      <p className="text-slate-500 text-sm mt-1">
                        Each document conversion costs 1 credit. Credits never expire and can be used for any supported file format.
                        We use {pricing?.currency} for all transactions.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {[
            {
              title: "Privacy First",
              desc: "Files are processed locally in your browser. No data is uploaded to any server.",
              icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
            },
            {
              title: "Lightning Fast",
              desc: "Optimized conversion engine ensures your documents are ready in seconds.",
              icon: <Zap className="w-5 h-5 text-yellow-500" />
            },
            {
              title: "High Quality",
              desc: "Crystal clear JPEG output and accurate text extraction from PDF layers.",
              icon: <FileText className="w-5 h-5 text-blue-500" />
            }
          ].map((feature, i) => (
            <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="mb-4">{feature.icon}</div>
              <h4 className="font-bold mb-2">{feature.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t mt-20 text-center text-slate-400 text-sm">
        <p>© 2026 Q-bit. Built with privacy in mind.</p>
      </footer>
    </div>
  );
}
