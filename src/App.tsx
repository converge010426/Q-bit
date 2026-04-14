/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Info,
  LogOut,
  Users,
  User,
  ShieldCheck,
  Mail
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
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('qbit_user_id'));
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('qbit_user_role'));
  const [showAdmin, setShowAdmin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user credits and pricing on mount
  React.useEffect(() => {
    if (userId) {
      fetchCredits();
      fetchPricing();
    }

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
  }, [userId]);

  const fetchCredits = async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/user/credits', {
        headers: { 'x-user-id': userId }
      });
      if (!res.ok) {
        throw new Error('API unavailable');
      }
      const data = await res.json();
      setCredits(data.credits);
      setUserRole(data.role);
      localStorage.setItem('qbit_user_role', data.role);
    } catch (error) {
      console.error('Failed to fetch credits, using demo mode:', error);
      setCredits(50); 
    }
  };

  const handleLogin = async (id: string) => {
    try {
      const url = `/api/auth/login?t=${Date.now()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id }),
        cache: 'no-store'
      });
      
      const responseText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // Not JSON
      }

      if (!res.ok) {
        if (res.status === 403 && data?.needsRegistration) {
          toast.info('Registration required for this trial ID');
          return { needsRegistration: true };
        }
        
        const errorMsg = data?.error || `Server Error (${res.status})`;
        toast.error(errorMsg);
        return;
      }
      
      if (!data) {
        toast.error(`Invalid server response. Please try again.`);
        return;
      }

      setUserId(data.user.user_id);
      setUserRole(data.user.role);
      localStorage.setItem('qbit_user_id', data.user.user_id);
      localStorage.setItem('qbit_user_role', data.user.role);
      toast.success(`Welcome back, ${data.user.user_id}!`);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(`Connection error. Please check your internet.`);
    }
  };

  const handleRegister = async (id: string, email: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, email })
      });
      
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Registration failed');
        return;
      }
      
      const data = await res.json();
      setUserId(data.user.user_id);
      setUserRole(data.user.role);
      localStorage.setItem('qbit_user_id', data.user.user_id);
      localStorage.setItem('qbit_user_role', data.user.role);
      toast.success(`Registration successful! Welcome, ${data.user.user_id}`);
      return { success: true };
    } catch (error) {
      toast.error('Registration failed');
    }
  };

  const handleLogout = () => {
    setUserId(null);
    setUserRole(null);
    localStorage.removeItem('qbit_user_id');
    localStorage.removeItem('qbit_user_role');
    setShowAdmin(false);
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
      const deductRes = await fetch('/api/user/deduct', { 
        method: 'POST',
        headers: { 'x-user-id': userId || '' }
      });
      if (deductRes.ok) {
        const deductData = await deductRes.ok ? await deductRes.json() : null;
        if (deductData) setCredits(deductData.credits);
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
        body: JSON.stringify({ tierId, userId })
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
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-primary/10 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(circle_at_50%_200px,#f8fafc,transparent)]"></div>
      
      <Toaster position="top-center" />
      
      {!userId ? (
        <Login onLogin={handleLogin} onRegister={handleRegister} />
      ) : (
        <>
          {/* Header */}
          <header className="border-b border-slate-100 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 shrink-0 flex items-center cursor-pointer" onClick={() => setShowAdmin(false)}>
                  <img 
                    src="/logo.png" 
                    alt="Q-bit Logo" 
                    className="h-full w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = document.createElement('span');
                      fallback.className = 'text-xl font-bold tracking-tight text-[#c41e3a]';
                      fallback.innerText = 'Q-bit';
                      e.currentTarget.parentElement?.appendChild(fallback);
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-6">
                <nav className="flex items-center gap-4 md:gap-6 text-sm font-medium text-slate-500">
                  {userRole === 'admin' && (
                    <button 
                      onClick={() => setShowAdmin(!showAdmin)} 
                      className={cn("flex items-center gap-1.5 transition-colors", showAdmin ? "text-primary" : "hover:text-primary")}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Admin
                    </button>
                  )}
                  <button onClick={() => setShowPricing(true)} className="hover:text-primary transition-colors">Pricing</button>
                  <button onClick={handleLogout} className="hover:text-red-500 transition-colors flex items-center gap-1.5">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
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

          <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 relative">
            {showAdmin ? (
              <AdminDashboard adminId={userId} />
            ) : (
              <>
                <div className="text-center mb-16">
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center mb-10"
                  >
                    <div className="max-w-[480px] w-full px-4 flex flex-col items-center">
                      <div className="relative group">
                        {/* Subtle glow effect behind logo */}
                        <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <img 
                          src="/logo.png" 
                          alt="Q-bit Logo" 
                          className="w-full h-auto object-contain relative z-10"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.className = 'flex flex-col items-center gap-2';
                            fallback.innerHTML = `
                              <div class="w-20 h-20 rounded-full bg-[#1a1c20] flex items-center justify-center border-4 border-[#2a2d35]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 2-2 10h3L11 22l2-10h-3L13 2z"/></svg>
                              </div>
                              <span class="text-6xl font-bold tracking-tighter text-[#c41e3a]">Q-bit</span>
                            `;
                            e.currentTarget.parentElement?.appendChild(fallback);
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-600"
                  >
                    Convert documents <br />
                    <span className="text-slate-400">instantly in your browser.</span>
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed"
                  >
                    Secure, client-side conversion. Your files never leave your device.
                    Supports PDF to Text, PDF to JPEG, Text to JPEG, and Word to Text/JPEG.
                  </motion.p>
                </div>

                <Card className="border border-slate-200/60 shadow-2xl shadow-slate-200/40 overflow-hidden bg-white/80 backdrop-blur-sm rounded-3xl">
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
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            {
              title: "Privacy First",
              desc: "Files are processed locally in your browser. No data is uploaded to any server.",
              icon: <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
            },
            {
              title: "Lightning Fast",
              desc: "Optimized conversion engine ensures your documents are ready in seconds.",
              icon: <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center mb-4"><Zap className="w-5 h-5 text-yellow-600" /></div>
            },
            {
              title: "High Quality",
              desc: "Crystal clear JPEG output and accurate text extraction from PDF layers.",
              icon: <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4"><FileText className="w-5 h-5 text-blue-600" /></div>
            }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="p-8 bg-white/50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/40 transition-all duration-500 group"
            >
              {feature.icon}
              <h4 className="font-bold text-lg mb-3 group-hover:text-primary transition-colors">{feature.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </>
    )}
  </main>

  <footer className="max-w-5xl mx-auto px-6 py-12 border-t mt-20 text-center text-slate-400 text-sm">
    <p>© 2026 Q-bit. Built with privacy in mind.</p>
  </footer>
</>
)}
</div>
);
}

function Login({ onLogin, onRegister }: { onLogin: (id: string) => Promise<any>, onRegister: (id: string, email: string) => Promise<any> }) {
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLoginSubmit = async () => {
    const result = await onLogin(id);
    if (result?.needsRegistration) {
      setIsRegistering(true);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    await onRegister(id, email);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
      
      <Card className="w-full max-w-md border border-slate-100 shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Q-bit" className="h-16 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isRegistering ? 'Register Trial Account' : 'Welcome to Q-bit'}
          </CardTitle>
          <CardDescription>
            {isRegistering 
              ? 'Please provide your email to activate your trial account' 
              : 'Enter your unique User ID to access your account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">User ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="e.g. user1"
                  disabled={isRegistering}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                  onKeyDown={(e) => e.key === 'Enter' && (isRegistering ? handleRegisterSubmit() : handleLoginSubmit())}
                />
              </div>
            </div>

            {isRegistering && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleRegisterSubmit()}
                  />
                </div>
              </motion.div>
            )}

            <Button 
              onClick={isRegistering ? handleRegisterSubmit : handleLoginSubmit} 
              className="w-full py-6 rounded-xl text-lg font-semibold shadow-lg shadow-primary/20"
            >
              {isRegistering ? 'Register & Login' : 'Login'}
            </Button>

            {isRegistering && (
              <button 
                onClick={() => setIsRegistering(false)}
                className="w-full text-sm text-slate-500 hover:text-primary transition-colors"
              >
                Back to Login
              </button>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6">
          <p className="text-center text-xs text-slate-400 w-full">
            Trial candidates: Use your assigned ID (e.g. user1, user2)
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

function AdminDashboard({ adminId }: { adminId: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-user-id': adminId }
      });
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addCredits = async (targetUserId: string, amount: number) => {
    try {
      const res = await fetch('/api/admin/users/credits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': adminId
        },
        body: JSON.stringify({ targetUserId, amount })
      });
      
      if (res.ok) {
        toast.success(`Added ${amount} credits to ${targetUserId}`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to update credits');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-slate-500">Manage trial candidates and their credit balances</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 border-primary/20 text-primary bg-primary/5">
          Admin Access
        </Badge>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.user_id} className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{user.user_id}</h3>
                  <div className="flex flex-col gap-0.5">
                    {user.email && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Mail className="w-3 h-3" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{user.credits} Credits</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => addCredits(user.user_id, 10)} className="rounded-lg">
                  +10
                </Button>
                <Button variant="outline" size="sm" onClick={() => addCredits(user.user_id, 50)} className="rounded-lg">
                  +50
                </Button>
                <Button variant="outline" size="sm" onClick={() => addCredits(user.user_id, 100)} className="rounded-lg">
                  +100
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
