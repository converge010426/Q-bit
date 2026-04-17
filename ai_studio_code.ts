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
import pricingData from '../pricing.json';

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
  const [pricing, setPricing] = useState<any>(pricingData);
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
      window.history.replaceState({}, document.title, window.location.pathname);
      
      const storedCredits = localStorage.getItem(`qbit_credits_${userId}`);
      if (storedCredits) {
        const newCredits = parseInt(storedCredits) + 50; 
        localStorage.setItem(`qbit_credits_${userId}`, newCredits.toString());
        setCredits(newCredits);
      }
    } else if (params.get('payment') === 'cancel') {
      toast.error('Payment cancelled.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [userId]);

  const fetchCredits = () => {
    if (!userId) return;
    
    if (userId === 'admin') {
      setCredits(9999);
      setUserRole('admin');
      return;
    }

    const storedCredits = localStorage.getItem(`qbit_credits_${userId}`);
    const storedRole = localStorage.getItem(`qbit_role_${userId}`) || 'user';
    
    if (storedCredits !== null) {
      setCredits(parseInt(storedCredits));
      setUserRole(storedRole);
    } else {
      const trialTier = pricingData.tiers.find(t => t.id === 'trial');
      const initialCredits = trialTier ? trialTier.credits : 5;
      
      setCredits(initialCredits);
      setUserRole('user');
      localStorage.setItem(`qbit_credits_${userId}`, initialCredits.toString());
      localStorage.setItem(`qbit_role_${userId}`, 'user');
    }
  };

  const handleLogin = async (id: string) => {
    const cleanId = id.trim().toLowerCase();
    const validUsers = ['admin', ...Array.from({ length: 10 }, (_, i) => `user${i + 1}`)];
    
    if (!validUsers.includes(cleanId)) {
      toast.error('Invalid User ID');
      return;
    }

    if (cleanId.startsWith('user')) {
      const isRegistered = localStorage.getItem(`qbit_registered_${cleanId}`);
      if (!isRegistered) {
        return { needsRegistration: true };
      }
    }

    const role = cleanId === 'admin' ? 'admin' : 'user';
    setUserId(cleanId);
    setUserRole(role);
    localStorage.setItem('qbit_user_id', cleanId);
    localStorage.setItem('qbit_user_role', role);
    
    fetchCredits();
    toast.success(`Welcome back, ${cleanId}!`);
    return { success: true };
  };

  const handleRegister = async (id: string, email: string) => {
    const cleanId = id.trim().toLowerCase();
    const trialTier = pricingData.tiers.find(t => t.id === 'trial');
    const initialCredits = trialTier ? trialTier.credits : 5;

    localStorage.setItem(`qbit_registered_${cleanId}`, 'true');
    localStorage.setItem(`qbit_email_${cleanId}`, email);
    localStorage.setItem(`qbit_credits_${cleanId}`, initialCredits.toString());
    localStorage.setItem(`qbit_role_${cleanId}`, 'user');
    
    setUserId(cleanId);
    setUserRole('user');
    localStorage.setItem('qbit_user_id', cleanId);
    localStorage.setItem('qbit_user_role', 'user');
    setCredits(initialCredits);
    
    toast.success(`Welcome, ${cleanId}! Your trial credits are ready.`);
    return { success: true };
  };

  const handleLogout = () => {
    setUserId(null);
    setUserRole(null);
    localStorage.removeItem('qbit_user_id');
    localStorage.removeItem('qbit_user_role');
    setShowAdmin(false);
  };

  const fetchPricing = () => {
    setPricing(pricingData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    let type: FileType = 'unknown';
    const fileName = file.name.toLowerCase();
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) type = 'pdf';
    else if (file.type === 'text/plain' || fileName.endsWith('.txt')) type = 'text';
    else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) type = 'word';
    
    if (type === 'unknown') {
      toast.error(`Unsupported file type. Please upload PDF, TXT, or Word files.`);
      return;
    }

    setFileState({ file, type, id: Math.random().toString(36).substring(7) });
    setResult(null);
    setProgress(0);
    
    if (type === 'text') setOutputFormat('jpeg');
    else if (type === 'word') setOutputFormat('pdf');
    else setOutputFormat('text');
  };

  const startConversion = async () => {
    if (!fileState) return;
    if (credits !== null && credits <= 0) {
      toast.error('Out of credits.');
      setShowPricing(true);
      return;
    }

    setIsConverting(true);
    setProgress(10);
    
    try {
      if (userId !== 'admin') {
        const newCredits = (credits || 0) - 1;
        setCredits(newCredits);
        localStorage.setItem(`qbit_credits_${userId}`, newCredits.toString());
      }

      let urls: string[] = [];
      if (fileState.type === 'pdf') {
        if (outputFormat === 'text') {
          const text = await convertPdfToText(fileState.file);
          urls = [URL.createObjectURL(new Blob([text], { type: 'text/plain' }))];
        } else if (outputFormat === 'jpeg') {
          const blobs = await convertPdfToImages(fileState.file);
          urls = blobs.map(blob => URL.createObjectURL(blob));
        }
      } else if (fileState.type === 'text') {
        const text = await fileState.file.text();
        if (outputFormat === 'jpeg') urls = [URL.createObjectURL(await convertTextToImage(text, fileState.file.name))];
      } else if (fileState.type === 'word') {
        const text = await convertWordToText(fileState.file);
        if (outputFormat === 'pdf') urls = [URL.createObjectURL(await convertTextToPdf(text, fileState.file.name))];
      }

      setProgress(100);
      setTimeout(() => {
        setResult({ urls, type: outputFormat });
        setIsConverting(false);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success('Conversion complete!');
      }, 500);
    } catch (error) {
      toast.error('Conversion failed.');
      setIsConverting(false);
    }
  };

  const downloadAll = () => {
    result?.urls.forEach((url, i) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileState?.file.name.split('.')[0]}_${i + 1}.${result.type === 'jpeg' ? 'jpg' : result.type}`;
      a.click();
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-primary/10 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
      <Toaster position="top-center" />
      
      {!userId ? (
        <Login onLogin={handleLogin} onRegister={handleRegister} />
      ) : (
        <>
          <header className="border-b border-slate-100 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold tracking-tight text-[#c41e3a]" onClick={() => setShowAdmin(false)}>Q-bit</span>
              </div>
              <div className="flex items-center gap-6">
                <nav className="flex items-center gap-6 text-sm font-medium text-slate-500">
                  {userRole === 'admin' && <button onClick={() => setShowAdmin(!showAdmin)} className="hover:text-primary">Admin</button>}
                  <button onClick={() => setShowPricing(true)} className="hover:text-primary">Pricing</button>
                  <button onClick={handleLogout} className="hover:text-red-500">Logout</button>
                </nav>
                <div className="bg-amber-50 px-3 py-1.5 rounded-full text-sm font-semibold text-amber-700">
                  <Coins className="w-4 h-4 inline mr-2" />
                  {credits} Credits
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-6 py-16 text-center">
            {showAdmin ? <AdminDashboard adminId={userId} /> : (
              <>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-600">
                  Convert documents <br />
                  <span className="text-slate-400">instantly in your browser.</span>
                </h1>
                
                <Card className="max-w-xl mx-auto border border-slate-200 mt-12 p-8">
                  {!fileState ? (
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-2xl p-12 cursor-pointer hover:bg-slate-50">
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                      <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="font-medium">Drag or click to upload</p>
                    </div>
                  ) : (
                    <div className="text-left space-y-6">
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                        <span className="font-medium truncate">{fileState.file.name}</span>
                        <X className="w-5 h-5 cursor-pointer" onClick={() => setFileState(null)} />
                      </div>
                      
                      {result ? (
                        <Button onClick={downloadAll} className="w-full h-14 rounded-xl text-lg">Download Result</Button>
                      ) : (
                        <Button onClick={startConversion} disabled={isConverting} className="w-full h-14 rounded-xl text-lg">
                          {isConverting ? <Loader2 className="animate-spin" /> : 'Start Conversion'}
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              </>
            )}
          </main>
        </>
      )}
    </div>
  );
}

function Login({ onLogin, onRegister }: { onLogin: (id: string) => Promise<any>, onRegister: (id: string, email: string) => Promise<any> }) {
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [isReg, setIsReg] = useState(false);
  
  const submit = async () => {
    if (isReg) {
      if (!email.includes('@')) return toast.error('Valid email required');
      await onRegister(id, email);
    } else {
      const res = await onLogin(id);
      if (res?.needsRegistration) setIsReg(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 space-y-4">
        <h2 className="text-2xl font-bold text-center">{isReg ? 'Activate Trial' : 'Login to Q-bit'}</h2>
        <input value={id} onChange={e => setId(e.target.value)} placeholder="User ID (e.g. user1)" className="w-full p-3 border rounded-xl" />
        {isReg && <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-3 border rounded-xl" />}
        <Button onClick={submit} className="w-full h-12">Continue</Button>
      </Card>
    </div>
  );
}

function AdminDashboard({ adminId }: { adminId: string }) {
  return <div className="p-10 text-center">Admin dashboard content here.</div>;
}