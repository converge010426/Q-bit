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
  Zap
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
  convertTextToImage 
} from '@/lib/converter';

type FileType = 'pdf' | 'text' | 'unknown';
type OutputFormat = 'text' | 'jpeg';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    let type: FileType = 'unknown';
    if (file.type === 'application/pdf') type = 'pdf';
    else if (file.type === 'text/plain') type = 'text';
    
    if (type === 'unknown') {
      toast.error('Unsupported file type. Please upload a PDF or Text file.');
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
    
    setIsConverting(true);
    setProgress(10);
    
    try {
      let urls: string[] = [];
      
      if (fileState.type === 'pdf') {
        if (outputFormat === 'text') {
          const text = await convertPdfToText(fileState.file);
          const blob = new Blob([text], { type: 'text/plain' });
          urls = [URL.createObjectURL(blob)];
        } else {
          const blobs = await convertPdfToImages(fileState.file);
          urls = blobs.map(blob => URL.createObjectURL(blob));
        }
      } else if (fileState.type === 'text') {
        const text = await fileState.file.text();
        const blob = await convertTextToImage(text, fileState.file.name);
        urls = [URL.createObjectURL(blob)];
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
      
    } catch (error) {
      console.error(error);
      toast.error('Conversion failed. Please try again.');
      setIsConverting(false);
      setProgress(0);
    }
  };

  const downloadResult = (url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    const extension = result?.type === 'text' ? 'txt' : 'jpg';
    const originalName = fileState?.file.name.split('.')[0] || 'converted';
    a.download = `${originalName}_${index + 1}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    result?.urls.forEach((url, i) => downloadResult(url, i));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans text-slate-900 selection:bg-primary/10">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight">DocuShift</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-primary transition-colors">How it works</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <Button variant="outline" size="sm" className="rounded-full">
              Github
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <div className="text-center mb-12">
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
            Supports PDF to Text, PDF to JPEG, and Text to JPEG.
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
                  accept=".pdf,.txt"
                />
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-medium text-lg mb-1">Click or drag file here</h3>
                <p className="text-slate-400 text-sm">PDF or TXT files up to 20MB</p>
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
                      <TabsList className="grid grid-cols-2 w-full bg-slate-100 p-1 rounded-xl">
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
                          Download File
                        </Button>
                      ) : (
                        <Button onClick={downloadAll} className="rounded-full px-8">
                          <Download className="w-4 h-4 mr-2" />
                          Download All ({result.urls.length} images)
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
        <p>© 2026 DocuShift. Built with privacy in mind.</p>
      </footer>
    </div>
  );
}
