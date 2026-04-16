import React from 'react';
import { motion } from 'motion/react';
import { Routes, Route, useNavigate, Link, useParams, Navigate } from 'react-router-dom';
import { questions, Question } from './questions';
import { calculateResults, typeDescriptions, AssessmentResults, MBTIType } from './logic';
import { ChevronRight, ChevronLeft, CheckCircle2, Download, FileText, ShieldCheck, Zap, Info, Brain, List, User, Trash2, Lock, Mail, X, Loader2, CreditCard } from 'lucide-react';
import { PRICING, BANKING_DETAILS, SYSTEM_VERSION } from './constants';

const Letterhead = () => (
  <header className="bg-navy p-8 md:p-12 -mx-8 md:-mx-16 -mt-8 md:-mt-16 mb-12 flex flex-col items-center text-center border-b border-gold/20">
    <Link to="/" className="flex flex-col items-center hover:opacity-90 transition-opacity">
      <h1 className="font-sans font-bold text-4xl md:text-5xl tracking-[4px] text-gold uppercase mb-4 flex items-start justify-center antialiased">
        CONVERGE<sup className="text-xs md:text-sm font-light mt-1 ml-0.5">™</sup>
      </h1>
      <div className="space-y-1 text-white text-sm md:text-base font-sans font-semibold leading-tight tracking-wide subpixel-antialiased opacity-95">
        <p>Three platforms. One integrated psychological insight.</p>
        <p>Three validated frameworks. One evidence-based hiring insight.</p>
        <p>Three frameworks. One executive advantage.</p>
        <p>Three developmental platforms. One transformational growth tool.</p>
      </div>
    </Link>
  </header>
);

const Footer = () => (
  <footer className="py-12 border-t border-gold/10 mt-auto">
    <div className="flex flex-col items-center text-center space-y-2">
      <p className="font-sans text-[10px] font-bold tracking-[3px] text-grey uppercase">
        © {new Date().getFullYear()} CONVERGE™ • ALL RIGHTS RESERVED
      </p>
      <p className="font-sans text-[8px] tracking-[1px] text-grey/60 uppercase max-w-xs">
        This assessment protocol and its integrated psychological architecture are protected intellectual property.
      </p>
      <p className="font-sans text-[8px] text-gold/50 uppercase mt-4 tracking-widest">
        System Version: {SYSTEM_VERSION}
      </p>
    </div>
  </footer>
);

const PayfastButton = ({ productKey }: { productKey: string }) => {
  const merchantId = (import.meta as any).env.VITE_PAYFAST_MERCHANT_ID || '21424325';
  const merchantKey = (import.meta as any).env.VITE_PAYFAST_MERCHANT_KEY || 'gclahuwgyvza';
  const payfastUrl = (import.meta as any).env.VITE_PAYFAST_URL || 'https://www.payfast.co.za/eng/process';
  
  const product = PRICING.products[productKey as keyof typeof PRICING.products];
  if (!product) return null;

  // Extract numeric value from price string (e.g., "R 150" -> 150)
  const amount = product.price.replace(/[^0-9]/g, '');
  const submissionId = localStorage.getItem('last_submission_id') || 'CONVERGE';

  return (
    <form action={payfastUrl} method="post" className="w-full">
      <input type="hidden" name="merchant_id" value={merchantId} />
      <input type="hidden" name="merchant_key" value={merchantKey} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="item_name" value={product.name} />
      <input type="hidden" name="m_payment_id" value={submissionId} />
      
      <button 
        type="submit"
        className="w-full bg-navy text-white py-4 px-6 font-sans text-xs font-bold tracking-[3px] uppercase hover:bg-gold transition-all flex items-center justify-center gap-3 shadow-lg group"
      >
        <CreditCard className="w-5 h-5 text-gold group-hover:text-white transition-colors" />
        Pay Now with Payfast
      </button>
    </form>
  );
};

export default function App() {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [userName, setUserName] = React.useState('');
  const [userEmail, setUserEmail] = React.useState('');
  const [selectedProduct, setSelectedProduct] = React.useState<'mbti' | 'comprehensive' | 'recruiter'>('mbti');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Job Context State for Converge 3
  const [jobTitle, setJobTitle] = React.useState('');
  const [jobEnvironment, setJobEnvironment] = React.useState('');
  const [jobChallenge, setJobChallenge] = React.useState('');
  const [jobDescription, setJobDescription] = React.useState('');

  React.useEffect(() => {
    console.log('[Frontend] Environment Check:');
    console.log('- VITE_SUPABASE_URL defined:', !!import.meta.env.VITE_SUPABASE_URL);
    console.log('- VITE_SUPABASE_ANON_KEY defined:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    console.log('- Vercel Environment:', !!(window as any).location.hostname.includes('vercel.app'));
    console.log('- Current Hostname:', window.location.hostname);
  }, []);

  const handleAnswer = (value: number) => {
    const q = questions[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [q.id]: value }));
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const submitAssessment = async (jobData?: any) => {
    setIsSubmitting(true);
    const results = calculateResults(answers);
    
    // Normalize results to match the structure that we know works (Test User structure)
    const normalizedResults = {
      mbti: results.mbti,
      bigFive: results.bigFive,
      ei: results.ei,
      scores: {
        E: results.bigFive.extraversion,
        O: results.bigFive.openness,
        C: results.bigFive.conscientiousness,
        A: results.bigFive.agreeableness,
        S: results.bigFive.emotionalStability
      }
    };
    
    console.log('[Frontend] Submitting assessment:', {
      name: userName,
      email: userEmail,
      product: selectedProduct,
      answersCount: Object.keys(answers).length,
      mbti: results.mbti,
      jobData
    });
    
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          answers,
          results: normalizedResults,
          product: selectedProduct,
          ...jobData
        })
      });
      
      console.log('[Frontend] Submission response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Frontend] Submission successful:', data);
        
        // Store in local history for debugging
        const history = JSON.parse(localStorage.getItem('submission_history') || '[]');
        history.unshift({
          id: data.id,
          timestamp: new Date().toISOString(),
          name: userName,
          email: userEmail
        });
        localStorage.setItem('submission_history', JSON.stringify(history.slice(0, 5)));
        
        if (data.id) localStorage.setItem('last_submission_id', data.id);
        localStorage.setItem('last_product', selectedProduct);
        navigate('/thank-you');
      } else {
        let errorMessage = 'There was an error submitting your assessment. Please try again.';
        let errorDetails = '';
        let rawBody = '';
        
        try {
          rawBody = await response.text();
          const errorData = JSON.parse(rawBody);
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData.details || JSON.stringify(errorData);
        } catch (e) {
          errorMessage = `Server Error (${response.status}): ${response.statusText || 'Unknown error'}`;
          errorDetails = rawBody || 'No additional details available.';
        }
        
        console.error('[Frontend] Submission failed:', errorMessage, errorDetails);
        alert(`SUBMISSION FAILED (${SYSTEM_VERSION})\n\nError: ${errorMessage}\n\nDetails: ${errorDetails.substring(0, 500)}${errorDetails.length > 500 ? '...' : ''}\n\nPlease take a screenshot of this and send it to me.`);
      }
    } catch (error: any) {
      console.error('[Frontend] Network error during submission:', error);
      alert(`Network error: ${error.message || 'Please check your connection.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Routes>
      <Route path="/" element={
        <div className="page-container p-8 md:p-16">
          <Letterhead />
          <main className="flex-1 py-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-warm p-8 border-b border-gold/20 mb-12"
            >
              <p className="text-lg leading-relaxed text-dark font-bold max-w-2xl">
                Welcome to the <strong>CONVERGE<sup>™</sup></strong> assessment. This protocol integrates MBTI, IPIP Big Five, and Emotional Intelligence frameworks to build a verified psychological architecture of your personality profile.
              </p>
            </motion.div>

            <div className="space-y-12 max-w-6xl">
              <section>
                <h2 className="section-label mb-6">Select Assessment Product</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <button 
                    onClick={() => setSelectedProduct('mbti')}
                    className={`p-6 border text-left transition-all relative flex flex-col justify-between ${selectedProduct === 'mbti' ? 'bg-navy text-white border-navy shadow-xl scale-[1.02]' : 'bg-white text-dark border-gold/20 hover:border-gold'}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${selectedProduct === 'mbti' ? 'bg-gold text-navy' : 'bg-gold/10 text-gold'}`}>
                            <Brain className="w-6 h-6" />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedProduct === 'mbti' ? 'text-gold' : 'text-grey'}`}>
                            Individual
                          </span>
                        </div>
                        {selectedProduct === 'mbti' && <CheckCircle2 className="w-6 h-6 text-gold" />}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{PRICING.products.mbti.name}</h3>
                      <p className={`text-sm mb-6 ${selectedProduct === 'mbti' ? 'text-white/80' : 'text-grey'}`}>
                        {PRICING.products.mbti.description}
                      </p>
                    </div>
                    <div className="flex justify-between items-end mt-auto">
                      <span className={`text-base font-black tracking-widest uppercase ${selectedProduct === 'mbti' ? 'text-gold' : 'text-navy/70'}`}>Option 1</span>
                      <div className="text-right">
                        <span className="text-4xl font-black leading-none">{PRICING.products.mbti.price}</span>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedProduct('comprehensive')}
                    className={`p-6 border text-left transition-all relative flex flex-col justify-between ${selectedProduct === 'comprehensive' ? 'bg-navy text-white border-navy shadow-xl scale-[1.02]' : 'bg-white text-dark border-gold/20 hover:border-gold'}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${selectedProduct === 'comprehensive' ? 'bg-gold text-navy' : 'bg-gold/10 text-gold'}`}>
                            <Zap className="w-6 h-6" />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedProduct === 'comprehensive' ? 'text-gold' : 'text-grey'}`}>
                            Individual
                          </span>
                        </div>
                        {selectedProduct === 'comprehensive' && <CheckCircle2 className="w-6 h-6 text-gold" />}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{PRICING.products.comprehensive.name}</h3>
                      <p className={`text-sm mb-6 ${selectedProduct === 'comprehensive' ? 'text-white/80' : 'text-grey'}`}>
                        {PRICING.products.comprehensive.description}
                      </p>
                    </div>
                    <div className="flex justify-between items-end mt-auto">
                      <span className={`text-base font-black tracking-widest uppercase ${selectedProduct === 'comprehensive' ? 'text-gold' : 'text-navy/70'}`}>Option 2</span>
                      <div className="text-right">
                        <span className="text-4xl font-black leading-none">{PRICING.products.comprehensive.price}</span>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedProduct('recruiter')}
                    className={`p-6 border text-left transition-all relative flex flex-col justify-between ${selectedProduct === 'recruiter' ? 'bg-navy text-white border-navy shadow-xl scale-[1.02]' : 'bg-white text-dark border-gold/20 hover:border-gold'}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${selectedProduct === 'recruiter' ? 'bg-gold text-navy' : 'bg-gold/10 text-gold'}`}>
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedProduct === 'recruiter' ? 'text-gold' : 'text-grey'}`}>
                            Recruiter
                          </span>
                        </div>
                        {selectedProduct === 'recruiter' && <CheckCircle2 className="w-6 h-6 text-gold" />}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{PRICING.products.recruiter.name}</h3>
                      <p className={`text-sm mb-6 ${selectedProduct === 'recruiter' ? 'text-white/80' : 'text-grey'}`}>
                        {PRICING.products.recruiter.description}
                      </p>
                    </div>
                    <div className="flex justify-between items-end mt-auto">
                      <span className={`text-base font-black tracking-widest uppercase ${selectedProduct === 'recruiter' ? 'text-gold' : 'text-navy/70'}`}>Option 3</span>
                      <div className="text-right">
                        <span className="text-4xl font-black leading-none">{PRICING.products.recruiter.price}</span>
                      </div>
                    </div>
                  </button>
                </div>
                <p className="text-[9px] text-grey font-bold uppercase tracking-widest text-center mt-6 opacity-70">
                  {PRICING.disclaimer}
                </p>
              </section>

              <section className="bg-white border border-gold/20 shadow-xl overflow-hidden">
                <div className="bg-navy p-4 text-center border-b border-gold/30">
                  <h2 className="text-gold font-sans font-black tracking-[4px] uppercase text-sm">Payment Information</h2>
                </div>
                
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gold/10">
                        <th className="p-6 text-[10px] font-black text-grey uppercase tracking-[2px]">Product Tier</th>
                        <th className="p-6 text-[10px] font-black text-navy uppercase tracking-[2px]">Fee ({PRICING.currency})</th>
                      </tr>
                    </thead>
                    <tbody className="text-dark font-bold">
                      <tr className="border-b border-gold/5 hover:bg-gold/5 transition-colors">
                        <td className="p-6 text-sm">{PRICING.products.mbti.name}</td>
                        <td className="p-6 text-sm text-navy">{PRICING.products.mbti.price}</td>
                      </tr>
                      <tr className="border-b border-gold/5 hover:bg-gold/5 transition-colors">
                        <td className="p-6 text-sm">{PRICING.products.comprehensive.name}</td>
                        <td className="p-6 text-sm text-navy">{PRICING.products.comprehensive.price}</td>
                      </tr>
                      <tr className="hover:bg-gold/5 transition-colors">
                        <td className="p-6 text-sm">{PRICING.products.recruiter.name}</td>
                        <td className="p-6 text-sm text-navy">{PRICING.products.recruiter.price}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-8 bg-warm/30 border-t border-gold/10">
                  <p className="text-[10px] text-navy font-black italic text-center mb-8 tracking-wide">
                    {PRICING.paymentNote}
                  </p>
                  
                  <div className="flex flex-col items-center">
                    <h3 className="text-navy font-sans font-black tracking-[3px] uppercase text-[11px] mb-6 border-b border-gold/30 pb-2">Banking Details ({PRICING.currency})</h3>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 max-w-md w-full">
                      <div className="text-right">
                        <span className="text-[9px] text-grey font-black uppercase tracking-widest block mb-1">Bank</span>
                        <span className="text-sm font-black text-navy">{BANKING_DETAILS.bank}</span>
                      </div>
                      <div className="text-left">
                        <span className="text-[9px] text-grey font-black uppercase tracking-widest block mb-1">Account Holder</span>
                        <span className="text-sm font-black text-navy">{BANKING_DETAILS.accountHolder}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-grey font-black uppercase tracking-widest block mb-1">Account Number</span>
                        <span className="text-sm font-black text-dark">{BANKING_DETAILS.accountNumber}</span>
                      </div>
                      <div className="text-left">
                        <span className="text-[9px] text-grey font-black uppercase tracking-widest block mb-1">Branch Code</span>
                        <span className="text-sm font-black text-dark">{BANKING_DETAILS.branchCode}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gold font-black uppercase tracking-[2px] mt-8 bg-navy px-4 py-2 rounded">
                      Reference: {BANKING_DETAILS.reference}
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid md:grid-cols-2 gap-12">
                <section>
                  <h2 className="section-label">Instructions</h2>
                  <ul className="space-y-4 text-dark font-bold">
                    <li className="flex gap-3">
                      <span className="text-gold font-bold">01</span>
                      <p>There are 60 questions in total. It should take approximately 10-15 minutes to complete.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-gold font-bold">02</span>
                      <p>Answer honestly based on your natural tendencies, not how you think you should behave.</p>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-gold font-bold">03</span>
                      <p>Try to avoid 'Neutral' answers where possible to ensure a more precise profile.</p>
                    </li>
                  </ul>
                </section>

                <section className="space-y-6">
                  <div>
                    <label className="block font-sans text-[10px] font-bold tracking-[2px] text-grey uppercase mb-3">Candidate Name</label>
                    <input 
                      type="text" 
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full p-4 bg-cream border border-gold/20 focus:border-gold outline-none font-sans font-black transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-sans text-[10px] font-bold tracking-[2px] text-grey uppercase mb-3">Email Address</label>
                    <input 
                      type="email" 
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full p-4 bg-cream border border-gold/20 focus:border-gold outline-none font-sans font-black transition-colors"
                    />
                  </div>
                  <button 
                    onClick={() => navigate('/quiz')}
                    disabled={!userName || !userEmail}
                    className="w-full group flex items-center justify-center gap-3 bg-navy text-white px-8 py-4 font-sans text-xs font-bold tracking-[3px] uppercase hover:bg-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Begin Assessment
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </section>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      } />

      <Route path="/quiz" element={
        <div className="page-container p-8 md:p-16 bg-cream">
          <Letterhead />
          <div className="mb-12">
            <div className="flex justify-end items-center mb-6">
              <div className="text-right">
                <h2 className="font-sans text-[10px] font-bold tracking-[4px] text-gold uppercase">Question {currentQuestionIndex + 1} of {questions.length}</h2>
                <span className="font-sans text-[10px] text-grey font-bold tracking-wider">{Math.round(progress)}% Complete</span>
              </div>
            </div>
            <div className="h-1 w-full bg-gold/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gold" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <main className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
            <motion.div 
              key={questions[currentQuestionIndex].id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-12"
            >
              <h3 className="text-3xl md:text-4xl text-navy font-bold leading-tight mb-12 antialiased">
                {questions[currentQuestionIndex].text}
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: 'Strongly Agree', val: 5 },
                  { label: 'Agree', val: 4 },
                  { label: 'Neutral', val: 3 },
                  { label: 'Disagree', val: 2 },
                  { label: 'Strongly Disagree', val: 1 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => handleAnswer(opt.val)}
                    className={`flex items-center justify-between p-6 border transition-all font-sans text-sm font-bold tracking-wide antialiased
                      ${answers[questions[currentQuestionIndex].id] === opt.val 
                        ? 'bg-navy text-white border-navy' 
                        : 'bg-white text-dark border-gold/20 hover:border-gold shadow-sm'}`}
                  >
                    {opt.label}
                    {answers[questions[currentQuestionIndex].id] === opt.val && <CheckCircle2 className="w-5 h-5 text-gold" />}
                  </button>
                ))}
              </div>
            </motion.div>

            <div className="flex justify-between items-center mt-auto pt-8">
              <button 
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="flex items-center gap-2 text-grey hover:text-navy disabled:opacity-30 transition-colors font-sans text-[10px] font-bold uppercase tracking-widest"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {currentQuestionIndex === questions.length - 1 && answers[questions[currentQuestionIndex].id] && (
                <button 
                  onClick={() => {
                    if (selectedProduct === 'recruiter') {
                      navigate('/job-context');
                    } else {
                      submitAssessment();
                    }
                  }}
                  disabled={isSubmitting}
                  className="bg-gold text-white px-10 py-4 font-sans text-xs font-bold tracking-[3px] uppercase hover:bg-gold/90 transition-all shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : (selectedProduct === 'recruiter' ? 'NEXT: JOB CONTEXT' : 'SUBMIT')}
                </button>
              )}
            </div>
          </main>
          <Footer />
        </div>
      } />

      <Route path="/job-context" element={
        <div className="page-container p-8 md:p-16 bg-cream">
          <Letterhead />
          <main className="flex-1 max-w-2xl mx-auto w-full py-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-10 border border-gold/20 shadow-2xl"
            >
              <div className="mb-8 text-center">
                <div className="inline-block p-3 bg-gold/10 rounded-full text-gold mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="mb-2">
                  <span className="font-sans text-[10px] font-bold tracking-[4px] text-gold uppercase">Step 2 of 2</span>
                </div>
                <h2 className="text-3xl text-navy font-bold uppercase tracking-tight mb-2">Define the Role</h2>
                <p className="text-grey font-bold text-sm uppercase tracking-widest mb-4">Converge 3 • Candidate Suitability Analysis</p>
                <p className="text-navy/60 text-xs font-sans font-medium italic">"Now, let's contextualize your results for the specific position."</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block font-sans text-[10px] font-bold tracking-[2px] text-grey uppercase mb-2">Job Title</label>
                  <input 
                    type="text" 
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Sales Executive"
                    className="w-full p-4 bg-navy text-white border border-gold/30 focus:border-gold outline-none font-sans font-black transition-colors placeholder:text-white/30"
                  />
                </div>

                <div>
                  <label className="block font-sans text-[10px] font-bold tracking-[2px] text-grey uppercase mb-2">Primary Environment</label>
                  <select 
                    value={jobEnvironment}
                    onChange={(e) => setJobEnvironment(e.target.value)}
                    className="w-full p-4 bg-navy text-white border border-gold/30 focus:border-gold outline-none font-sans font-black transition-colors"
                  >
                    <option value="" className="bg-white text-navy">Select Environment...</option>
                    <option value="High-pressure / Fast-paced" className="bg-white text-navy">High-pressure / Fast-paced</option>
                    <option value="Collaborative / Team-oriented" className="bg-white text-navy">Collaborative / Team-oriented</option>
                    <option value="Solo / Technical / Focused" className="bg-white text-navy">Solo / Technical / Focused</option>
                    <option value="Client-facing / Relationship-based" className="bg-white text-navy">Client-facing / Relationship-based</option>
                    <option value="Creative / Unstructured" className="bg-white text-navy">Creative / Unstructured</option>
                  </select>
                </div>

                <div>
                  <label className="block font-sans text-[10px] font-bold tracking-[2px] text-grey uppercase mb-2">Key Challenge</label>
                  <input 
                    type="text" 
                    value={jobChallenge}
                    onChange={(e) => setJobChallenge(e.target.value)}
                    placeholder="e.g. Requires high emotional resilience"
                    className="w-full p-4 bg-navy text-white border border-gold/30 focus:border-gold outline-none font-sans font-black transition-colors placeholder:text-white/30"
                  />
                </div>

                <div>
                  <label className="block font-sans text-[10px] font-bold tracking-[2px] text-grey uppercase mb-2">Job Description (Optional)</label>
                  <textarea 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description or key requirements here..."
                    rows={4}
                    className="w-full p-4 bg-navy text-white border border-gold/30 focus:border-gold outline-none font-sans font-black transition-colors resize-none placeholder:text-white/30"
                  />
                </div>

                <button 
                  onClick={() => submitAssessment({
                    jobTitle,
                    jobEnvironment,
                    jobChallenge,
                    jobDescription
                  })}
                  disabled={isSubmitting || !jobTitle || !jobEnvironment}
                  className="w-full bg-navy text-white px-8 py-4 font-sans text-xs font-bold tracking-[3px] uppercase hover:bg-navy/90 transition-all shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing Analysis...' : 'Complete Analysis'}
                </button>
              </div>
            </motion.div>
          </main>
          <Footer />
        </div>
      } />

      <Route path="/thank-you" element={
        <div className="page-container p-8 md:p-16 bg-cream">
          <Letterhead />
          <main className="flex-1 flex flex-col items-center justify-center text-center py-12 max-w-5xl mx-auto">
            <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center text-gold mb-8">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-4xl text-navy font-bold mb-4 antialiased uppercase tracking-tight">Assessment Submitted</h2>
            <p className="text-xl text-dark font-semibold max-w-lg mb-8 antialiased">
              Thank you, {userName || 'Candidate'}. Your assessment has been successfully received and is being processed.
            </p>
            
            <div className="bg-warm p-8 border-l-4 border-gold max-w-xl mb-12">
              <p className="text-navy font-bold italic leading-relaxed antialiased">
                "The results will be sent to your e-mail after verification that the assessment fee has been paid."
              </p>
              {localStorage.getItem('last_submission_id') && (
                <p className="text-[10px] text-navy/40 mt-4 uppercase tracking-widest">
                  Submission ID: {localStorage.getItem('last_submission_id')}
                </p>
              )}
            </div>

            <div className="w-full max-w-4xl bg-white border border-gold/20 shadow-2xl overflow-hidden mb-12 text-left">
              <div className="bg-navy p-6 text-center">
                <h3 className="text-gold font-sans font-bold tracking-[3px] uppercase text-sm antialiased">Payment Information</h3>
              </div>
              <div className="p-8 space-y-10">
                {/* Pricing Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-gold/20">
                        <th className="py-3 px-4 font-sans text-[9px] font-bold tracking-widest text-grey uppercase">Product Tier</th>
                        <th className="py-3 px-4 font-sans text-[9px] font-bold tracking-widest text-navy uppercase">Fee ({PRICING.currency})</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-bold">
                      <tr className="border-b border-gold/5">
                        <td className="py-4 px-4 text-navy">{PRICING.products.mbti.name}</td>
                        <td className="py-4 px-4 text-navy">{PRICING.products.mbti.price}</td>
                      </tr>
                      <tr className="border-b border-gold/5">
                        <td className="py-4 px-4 text-navy">{PRICING.products.comprehensive.name}</td>
                        <td className="py-4 px-4 text-navy">{PRICING.products.comprehensive.price}</td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 text-navy">{PRICING.products.recruiter.name}</td>
                        <td className="py-4 px-4 text-navy">{PRICING.products.recruiter.price}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-navy font-bold uppercase tracking-tight italic px-4 text-center">
                  {PRICING.paymentNote}
                </p>

                {/* Payment Options Section */}
                <div className="px-4">
                  <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Banking Details Table */}
                    <div className="space-y-4">
                      <h4 className="font-sans font-bold text-navy uppercase text-[10px] tracking-widest border-b border-gold/20 pb-2 text-center">EFT Banking Details ({PRICING.currency})</h4>
                      <table className="w-full text-xs">
                        <tbody>
                          <tr>
                            <td className="py-1.5 text-grey font-bold uppercase tracking-tighter w-32">Bank</td>
                            <td className="py-1.5 text-navy font-bold">{BANKING_DETAILS.bank}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 text-grey font-bold uppercase tracking-tighter">Account Name</td>
                            <td className="py-1.5 text-navy font-bold">{BANKING_DETAILS.accountHolder}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 text-grey font-bold uppercase tracking-tighter">Account Number</td>
                            <td className="py-1.5 text-navy font-bold">{BANKING_DETAILS.accountNumber}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 text-grey font-bold uppercase tracking-tighter">Branch Code</td>
                            <td className="py-1.5 text-navy font-bold">{BANKING_DETAILS.branchCode} (Universal)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Payfast Integration */}
                    <div className="space-y-4">
                      <h4 className="font-sans font-bold text-navy uppercase text-[10px] tracking-widest border-b border-gold/20 pb-2 text-center">Online Payment (Payfast)</h4>
                      <div className="h-full flex flex-col items-center justify-center border border-gold/10 p-6 bg-gold/5 rounded-sm">
                        <div className="mb-6 text-center">
                          <p className="text-[10px] text-navy font-bold uppercase tracking-widest mb-2">Secure Instant EFT & Card</p>
                          <p className="text-[8px] text-grey uppercase tracking-tighter">Powered by Payfast South Africa</p>
                        </div>
                        
                        <PayfastButton productKey={localStorage.getItem('last_product') || 'mbti'} />
                        
                        <p className="text-[8px] text-grey/60 uppercase tracking-tighter mt-4 text-center">
                          Your report will be processed upon payment verification
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-cream p-6 text-center border-t border-gold/10">
                <p className="text-[10px] text-grey font-bold uppercase tracking-[3px] antialiased">
                  Reference: {BANKING_DETAILS.reference}
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="text-navy font-sans text-[10px] font-bold tracking-[3px] uppercase border-b border-navy pb-1 hover:text-gold hover:border-gold transition-colors"
            >
              Return Home
            </button>
          </main>
          <Footer />
        </div>
      } />

      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/result/:id" element={
        <ProtectedRoute>
          <AdminResultDetail />
        </ProtectedRoute>
      } />
      <Route path="/admin/login" element={<AdminLogin />} />
    </Routes>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('admin_auth') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

function AdminLogin() {
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = (import.meta as any).env.VITE_ADMIN_PASSWORD;
    if (!adminPassword) {
      setError('System Error: Admin password not configured in environment.');
      return;
    }
    if (password === adminPassword) {
      localStorage.setItem('admin_auth', 'true');
      navigate('/admin');
    } else {
      setError('Invalid administrative credentials.');
    }
  };

  return (
    <div className="page-container p-8 md:p-16 bg-cream flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-12 border border-gold/20 shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-navy text-gold rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="font-sans font-bold text-2xl text-navy tracking-[4px] uppercase">Admin Access</h1>
          <p className="text-grey text-[10px] font-bold tracking-widest uppercase mt-2">Converge Assessment Protocol</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block font-sans text-[10px] font-bold tracking-[2px] text-grey uppercase mb-3">Security Key</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full p-4 bg-cream border border-gold/20 focus:border-gold outline-none font-sans font-black transition-colors"
            />
          </div>
          {error && <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider text-center">{error}</p>}
          <button 
            type="submit"
            className="w-full bg-navy text-white px-8 py-4 font-sans text-xs font-bold tracking-[3px] uppercase hover:bg-navy/90 transition-all"
          >
            Authenticate
          </button>
          <Link to="/" className="block text-center text-grey text-[10px] font-bold uppercase tracking-widest hover:text-navy transition-colors mt-4">
            Return to Site
          </Link>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<any>(null);
  const [showRaw, setShowRaw] = React.useState(false);
  const [localHistory, setLocalHistory] = React.useState<any[]>([]);

  React.useEffect(() => {
    const history = JSON.parse(localStorage.getItem('submission_history') || '[]');
    setLocalHistory(history);
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (deletingId === id) {
      try {
        const res = await fetch(`/api/results/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setSubmissions(prev => prev.filter(s => s.id !== id));
          setDeletingId(null);
        } else {
          const err = await res.json();
          alert(`Delete failed: ${err.details || err.error}`);
        }
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    } else {
      setDeletingId(id);
      // Reset after 3 seconds if not confirmed
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleSendReport = async (e: React.MouseEvent, sub: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`Send report to ${sub.name} (${sub.email})?`)) return;

    const btn = e.currentTarget as HTMLButtonElement;
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'SENDING...';

    try {
      const res = await fetch('/api/admin/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: sub.id, 
          email: sub.email, 
          name: sub.name, 
          reportUrl: sub.report_url || sub.reportPath 
        })
      });

      if (res.ok) {
        alert('Report sent successfully!');
        setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, email_sent: true } : s));
      } else {
        const err = await res.json();
        alert(`Failed to send: ${err.details || err.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  };

  const [diagInfo, setDiagInfo] = React.useState<{ status: string, count: string, exact: string, serviceRole: string, connectionOk: string, connectionError: string, urlPreview: string } | null>(null);

  React.useEffect(() => {
    console.log('[Dashboard] Fetching results from /api/results...');
    fetch('/api/results')
      .then(async res => {
        console.log('[Dashboard] Response status:', res.status);
        // Capture diagnostic headers
        setDiagInfo({
          status: res.headers.get('x-supabase-status') || 'N/A',
          count: res.headers.get('x-supabase-count') || 'N/A',
          exact: res.headers.get('x-supabase-exact-count') || 'N/A',
          serviceRole: res.headers.get('x-using-service-role') || 'false',
          connectionOk: res.headers.get('x-connection-ok') || 'false',
          connectionError: res.headers.get('x-connection-error') || '',
          urlPreview: res.headers.get('x-supabase-url-preview') || 'N/A'
        });
        
        if (!res.ok) {
          const err = await res.json();
          console.error('[Dashboard] API Error:', err);
          throw new Error(err.details || err.error || err.message || 'Failed to fetch results');
        }
        return res.json();
      })
      .then(data => {
        console.log('[Dashboard] Data received:', Array.isArray(data) ? data.length : 'not an array');
        const parsedData = Array.isArray(data) ? data.map((sub: any) => {
          if (sub.results && typeof sub.results === 'string') {
            try {
              sub.results = JSON.parse(sub.results);
            } catch (e) {
              console.error('Failed to parse results in dashboard:', e);
            }
          }
          return sub;
        }) : [];
        setSubmissions(parsedData);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Dashboard] Fetch Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const testSubmission = async () => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Test User (AI Studio)",
          email: "test@example.com",
          answers: { "q1": 3, "q2": 4 },
          results: { mbti: "INTJ", scores: { E: 0, I: 10, S: 0, N: 10, T: 10, F: 0, J: 10, P: 0 } },
          product: "mbti"
        })
      });
      if (response.ok) {
        alert("Test submission successful! Refreshing...");
        window.location.reload();
      } else {
        const err = await response.json();
        alert("Test submission failed: " + (err.details || err.message));
      }
    } catch (err) {
      alert("Network error during test submission");
    }
  };

  return (
    <div className="page-container p-8 md:p-16 bg-cream">
      <header className="mb-12 flex justify-between items-center border-b border-gold/20 pb-8">
        <div>
          <h1 className="font-sans font-bold text-2xl text-navy tracking-[2px] uppercase">Admin Dashboard</h1>
          <p className="text-grey text-xs font-bold tracking-widest uppercase mt-1">Assessment Submissions</p>
        </div>
        <Link to="/" className="text-navy font-sans text-[10px] font-bold tracking-[2px] uppercase hover:text-gold transition-colors">
          View Site
        </Link>
      </header>

      <main className="space-y-4">
        <div className="bg-navy/5 p-4 border border-navy/10 mb-6 rounded text-[10px] font-mono text-navy/60">
          <p className="font-bold text-gold mb-2">VERSION: 7.7 (ON-DEMAND REGEN & PREVIEW)</p>
          <p className="text-[8px] opacity-30 mb-2">SYNC_ID: SYNC_20260408_1115</p>
          <p>DEBUG INFO:</p>
          <p>Current URL: {window.location.hostname}</p>
          <div className={`p-2 mb-2 rounded font-bold ${window.location.hostname.includes('vercel.app') ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
            ENVIRONMENT: {window.location.hostname.includes('vercel.app') ? '🚀 VERCEL (REAL)' : '🛠 AI STUDIO (PREVIEW)'}
          </div>
          
          {!window.location.hostname.includes('vercel.app') && (
            <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
              <p className="font-bold">⚠️ YOU ARE IN THE PREVIEW WINDOW</p>
              <p>This window is for testing code changes. To see your REAL data, you must visit your Vercel URL.</p>
              <p className="mt-1">1. Go to your Vercel Dashboard.</p>
              <p>2. Click on your project name.</p>
              <p>3. Click the **"Visit"** button.</p>
              <p>4. Add **/admin** to the end of that URL.</p>
            </div>
          )}
          
          <p>Supabase URL (Client): {import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL.substring(0, 20)}...` : 'NOT SET'}</p>
          <p>Supabase URL (Backend): {diagInfo?.urlPreview || 'FETCHING...'}</p>
          <p>Submissions Count: {submissions.length}</p>
          <p>Local History Count: {JSON.parse(localStorage.getItem('submission_history') || '[]').length}</p>
          {diagInfo && (
            <div className="mt-2 pt-2 border-t border-navy/10 text-gold/80">
              <p>DB DIAGNOSTICS:</p>
              <p>HTTP Status: {diagInfo.status}</p>
              <p>Data Count: {diagInfo.count}</p>
              <p>Exact DB Count: {diagInfo.exact}</p>
              <p>DB Connection: {diagInfo.connectionOk === 'true' ? '✅ OK' : '❌ FAILED'}</p>
              {diagInfo.connectionError && <p className="text-red-400">Error: {diagInfo.connectionError}</p>}
              <p>RLS Bypass (Service Role): {diagInfo.serviceRole === 'true' ? '✅ ACTIVE' : '❌ NOT SET'}</p>
              
              {diagInfo.exact === '0' && submissions.length === 0 && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px]">
                  <p className="font-bold">⚠️ CRITICAL: DATABASE IS EMPTY</p>
                  <p>Supabase reports 0 rows in 'submissions'.</p>
                  <p>1. Check if table name is exactly 'submissions' (lowercase).</p>
                  <p>2. Ensure columns: id, name, email, product, mbti, results, answers, report_url exist.</p>
                  <p>3. If you just submitted, the data was NOT saved.</p>
                </div>
              )}
              
              {diagInfo.serviceRole === 'false' && (
                <div className="mt-2 p-2 bg-gold/10 border border-gold/20 text-gold text-[9px]">
                  <p className="font-bold">💡 TIP: BYPASS RLS</p>
                  <p>Add 'SUPABASE_SERVICE_ROLE_KEY' to your environment variables to bypass security policies for this dashboard.</p>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-4 mt-4">
            <button 
              onClick={async () => {
                const res = await fetch('/api/admin/diagnostics');
                const data = await res.json();
                alert(JSON.stringify(data, null, 2));
              }} 
              className="mt-2 text-gold hover:underline font-bold uppercase tracking-widest"
            >
              Show Diagnostics
            </button>
            <button 
              onClick={async () => {
                const res = await fetch('/api/admin/test-email');
                const data = await res.json();
                alert(JSON.stringify(data, null, 2));
              }} 
              className="mt-2 text-gold hover:underline font-bold uppercase tracking-widest"
            >
              Send Test Email
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-gold hover:underline font-bold uppercase tracking-widest"
            >
              Force Refresh Dashboard
            </button>
            <button 
              onClick={testSubmission} 
              className="mt-2 text-navy hover:underline font-bold uppercase tracking-widest"
            >
              Send Test Submission
            </button>
            <button 
              onClick={() => setShowRaw(!showRaw)} 
              className="mt-2 text-navy/40 hover:underline font-bold uppercase tracking-widest"
            >
              {showRaw ? 'Hide' : 'Show'} Raw Data
            </button>
          </div>
          {showRaw && (
            <pre className="mt-4 p-4 bg-white border border-navy/10 overflow-auto max-h-96 text-[8px]">
              {JSON.stringify(submissions, null, 2)}
            </pre>
          )}
        </div>

        {localHistory.length > 0 && (
          <div className="bg-gold/5 p-4 border border-gold/20 mb-6 rounded">
            <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest mb-2">Local Submission History (Last 5)</h4>
            <div className="space-y-2">
              {localHistory.map((h, i) => {
                const isFound = submissions.some(s => String(s.id) === String(h.id));
                return (
                  <div key={i} className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-navy">ID: {h.id} | {h.name} ({h.email})</span>
                    <span className={isFound ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {isFound ? '✓ FOUND IN DATABASE' : '✗ MISSING FROM DATABASE'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {loading ? (
          <p className="text-center py-20 text-grey font-bold animate-pulse">Loading submissions...</p>
        ) : error ? (
          <div className="text-center py-20 bg-red-50 border border-red-200 p-8">
            <p className="text-red-600 font-bold mb-2">Error Loading Dashboard</p>
            <p className="text-red-500 text-sm">{error}</p>
            <p className="text-xs text-red-400 mt-4">Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in environment variables.</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-gold/30">
            <p className="text-grey font-bold">No submissions found yet.</p>
          </div>
        ) : (
          submissions.map((sub) => (
            <Link 
              key={sub.id} 
              to={`/admin/result/${sub.id}`}
              className="block bg-white p-6 border border-gold/10 hover:border-gold transition-colors group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl text-navy font-bold group-hover:text-gold transition-colors">{sub.name}</h3>
                  <p className="text-grey text-sm font-semibold">{sub.email}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-navy font-bold text-lg">{sub.results?.mbti}</div>
                  <div className="text-[8px] font-bold tracking-widest uppercase text-gold mb-1">
                    {sub.product === 'recruiter' ? 'Converge 3' : sub.product === 'comprehensive' ? 'Converge 2' : 'Converge 1'}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {(sub.reportPath || sub.report_url) ? (
                      <>
                        <a 
                          href={sub.reportPath || sub.report_url} 
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 bg-gold/10 text-gold px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase hover:bg-gold hover:text-white transition-colors border border-gold/20"
                        >
                          <FileText className="w-2 h-2" />
                          Preview Report
                        </a>
                        <button
                          onClick={(e) => handleSendReport(e, sub)}
                          className={`flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase transition-colors border ${sub.email_sent ? 'bg-green-600/10 text-green-600 border-green-600/20' : 'bg-navy text-white border-navy hover:bg-gold hover:border-gold'}`}
                        >
                          <Mail className="w-2 h-2" />
                          {sub.email_sent ? 'SENT' : 'SEND TO CLIENT'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const btn = e.currentTarget;
                          btn.disabled = true;
                          btn.innerText = 'GENERATING...';
                          try {
                            const res = await fetch('/api/admin/generate-report', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: sub.id })
                            });
                            if (res.ok) {
                              const data = await res.json();
                              window.location.reload();
                            } else {
                              const errData = await res.json();
                              alert(`Generation failed: ${errData.message || errData.error || 'Unknown error'}\n\nTry opening the result detail page to see if it generates there.`);
                              btn.disabled = false;
                              btn.innerText = 'GENERATE REPORT';
                            }
                          } catch (err) {
                            alert('Error triggering generation.');
                            btn.disabled = false;
                            btn.innerText = 'GENERATE REPORT';
                          }
                        }}
                        className="flex items-center gap-1 bg-navy text-white px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase hover:bg-gold transition-colors border border-navy"
                      >
                        <Loader2 className="w-2 h-2 animate-spin" />
                        Generate Report
                      </button>
                    )}
                    <div className="text-grey text-[9px] font-bold tracking-tighter uppercase">
                      {(() => {
                        const date = sub.submitted_at || sub.submittedAt;
                        if (!date) return 'Unknown Date';
                        try {
                          return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                        } catch (e) {
                          return 'Invalid Date';
                        }
                      })()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, sub.id)}
                  className={`ml-4 p-2 rounded-full transition-all flex items-center gap-2 ${
                    deletingId === sub.id 
                      ? 'bg-red-600 text-white px-4' 
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  {deletingId === sub.id ? (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Confirm?</span>
                    </>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </Link>
          ))
        )}
      </main>
      <Footer />
    </div>
  );
}

function AdminResultDetail() {
  const { id } = useParams();
  const [submission, setSubmission] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/results')
      .then(async res => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.details || err.error || err.message || 'Failed to fetch results');
        }
        return res.json();
      })
      .then(data => {
        const found = data.find((s: any) => s.id.toString() === id);
        if (found) {
          // Robust parsing
          if (found.results) {
            if (typeof found.results === 'string') {
              try {
                found.results = JSON.parse(found.results);
              } catch (e) {
                console.error('Failed to parse results JSON:', e);
                found.results = { mbti: found.mbti || 'Unknown' };
              }
            }
          } else {
            found.results = { mbti: found.mbti || 'Unknown' };
          }
          
          // Ensure results is an object
          if (typeof found.results !== 'object') {
            found.results = { mbti: found.mbti || 'Unknown' };
          }
        }
        setSubmission(found);
      })
      .catch(err => {
        console.error('Detail error:', err);
        setError(err.message);
      });
  }, [id]);

  if (error) return <div className="p-20 text-center font-bold text-red-600">Error: {error}</div>;
  if (!submission) return <div className="p-20 text-center font-bold text-navy">Loading result...</div>;

  const { results, name, email } = submission;
  const submittedAt = submission.submitted_at || submission.submittedAt;
  const reportPath = submission.report_url || submission.reportPath;
  const typeInfo = results?.mbti ? typeDescriptions[results.mbti as MBTIType] : null;

  const [isSending, setIsSending] = React.useState(false);
  const [reviewChecked, setReviewChecked] = React.useState(false);
  const [checklist, setChecklist] = React.useState<Record<number, boolean>>({});
  const [adminNotes, setAdminNotes] = React.useState(submission.admin_notes || '');
  const [isSavingNotes, setIsSavingNotes] = React.useState(false);

  const handleChecklistChange = (index: number, checked: boolean) => {
    const newChecklist = { ...checklist, [index]: checked };
    setChecklist(newChecklist);
    const allChecked = [0, 1, 2, 3].every(i => newChecklist[i]);
    setReviewChecked(allChecked);
  };

  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerateReport = React.useCallback(async () => {
    if (!submission || submission.report_url || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submission.id })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmission((prev: any) => ({ ...prev, report_url: data.reportUrl }));
      }
    } catch (err) {
      console.error('Error in auto-generation:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [submission, isGenerating]);

  React.useEffect(() => {
    if (submission && !submission.report_url && !isGenerating) {
      handleGenerateReport();
    }
  }, [submission, isGenerating, handleGenerateReport]);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/results/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes })
      });
      if (res.ok) alert('Notes saved successfully.');
    } catch (err) {
      alert('Error saving notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSendReport = async () => {
    if (!reviewChecked) {
      alert('Please complete the review checklist before sending.');
      return;
    }
    if (!confirm(`Send report to ${email}?`)) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/admin/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submission.id, email, name, reportUrl: reportPath })
      });
      if (res.ok) {
        alert('Report sent successfully!');
        setSubmission((prev: any) => ({ ...prev, email_sent: true }));
      } else {
        const data = await res.json();
        alert(`Failed to send report: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Error sending report.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="page-container p-8 md:p-16">
      <div className="mb-8 flex justify-between items-center">
        <Link to="/admin" className="flex items-center gap-2 text-grey hover:text-navy transition-colors font-sans text-[10px] font-bold uppercase tracking-widest">
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="text-right flex items-center gap-4">
          {submission.email_sent && (
            <span className="bg-green-600 text-white px-3 py-1 text-[8px] font-bold tracking-[2px] uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Sent to Client
            </span>
          )}
          <div className="flex gap-2">
            <div className="relative group">
              <button
                onClick={handleSendReport}
                disabled={isSending}
                className={`flex items-center gap-2 px-4 py-1 text-[10px] font-bold tracking-[2px] uppercase transition-colors disabled:opacity-50
                  ${reviewChecked ? 'bg-navy text-white hover:bg-gold' : 'bg-grey/20 text-grey cursor-not-allowed'}`}
              >
                <Mail className="w-3 h-3" />
                {isSending ? 'Sending...' : 'Approve & Send'}
              </button>
              {!reviewChecked && (
                <div className="absolute top-full right-0 mt-1 hidden group-hover:block bg-navy text-white text-[7px] px-2 py-1 whitespace-nowrap z-10">
                  Complete checklist below to enable sending
                </div>
              )}
            </div>
            {reportPath ? (
              <a 
                href={reportPath}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gold text-white px-4 py-1 text-[10px] font-bold tracking-[2px] uppercase hover:bg-gold/90 transition-colors"
              >
                <FileText className="w-3 h-3" />
                Preview Report
              </a>
            ) : (
              <div className="flex items-center gap-2 bg-gold/10 text-gold px-4 py-1 text-[10px] font-bold tracking-[2px] uppercase animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Generating PDF...
              </div>
            )}
          </div>
          <span className="bg-navy text-white px-3 py-1 text-[8px] font-bold tracking-[2px] uppercase">Internal Report</span>
        </div>
      </div>

      <div className="mb-12 grid md:grid-cols-2 gap-8 bg-gold/5 p-8 border border-gold/20">
        <div>
          <h4 className="font-sans font-bold text-[10px] tracking-[3px] uppercase text-navy mb-4">Oversight Checklist</h4>
          <div className="space-y-3">
            {[
              'Verify MBTI type matches cognitive markers',
              'Check for blatant mis-prints or formatting errors',
              'Ensure Suitability Indicators align with role context',
              'Confirm candidate name and details are correct'
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-gold"
                  checked={!!checklist[i]}
                  onChange={(e) => handleChecklistChange(i, e.target.checked)}
                />
                <span className="text-xs text-navy font-medium group-hover:text-gold transition-colors">{item}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-sans font-bold text-[10px] tracking-[3px] uppercase text-navy mb-4">Internal Admin Notes</h4>
          <textarea 
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add internal observations or review notes here..."
            className="w-full h-24 p-4 text-xs bg-white border border-gold/20 focus:border-gold outline-none font-sans font-medium resize-none"
          />
          <button 
            onClick={handleSaveNotes}
            disabled={isSavingNotes}
            className="mt-2 text-[8px] font-bold tracking-[2px] uppercase text-gold hover:text-navy transition-colors flex items-center gap-1"
          >
            {isSavingNotes ? 'Saving...' : 'Save Internal Notes'}
          </button>
        </div>
      </div>

      <Letterhead />
      
      <div className="py-10 border-b border-gold/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="font-sans font-bold text-4xl text-navy mb-1">{name}</h2>
            <p className="font-sans text-grey text-sm font-semibold mb-2">{submission.email}</p>
            <p className="font-sans text-gold italic text-lg">
              {results?.mbti || 'Unknown Type'} 
              {typeInfo && ` • ${typeInfo.title} • ${typeInfo.subtitle}`}
            </p>
            <p className="font-sans text-grey text-[10px] tracking-[2px] uppercase mt-4">Assessment Date: {submittedAt ? new Date(submittedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Unknown'}</p>
          </div>
          <div className="bg-warm p-6 border-l-2 border-gold">
            <div className="flex items-center gap-4 mb-2">
              <div className="text-grey font-sans text-[8px] font-bold tracking-[3px] uppercase">
                {submission.product === 'recruiter' ? 'Converge 3' : submission.product === 'comprehensive' ? 'Converge 2' : 'Converge 1'}
              </div>
            </div>
            <div className="text-navy font-sans text-5xl font-bold">{results?.mbti || 'N/A'}</div>
            <div className="text-gold font-sans italic text-[10px] mt-1">Cross-validated</div>
          </div>
        </div>
      </div>

      <div className="bg-warm px-10 md:px-16 py-8 border-b border-gold/10">
        <p className="text-lg leading-relaxed text-dark font-bold italic antialiased">
          CONVERGE<sup>™</sup> has identified a verified psychological architecture. Your results show high consistency across all three validated frameworks.
        </p>
      </div>

      <main className="px-10 md:px-16 py-12">
        <section className="mb-16 break-inside-avoid">
          <h2 className="section-label">Section 1 • Personality Type Analysis</h2>
          <div className="bg-white p-8 border border-gold/10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
              <div className="flex-1">
                <h3 className="text-5xl text-navy font-bold mb-4 antialiased italic">{results?.mbti || 'Unknown'}</h3>
                {typeInfo ? (
                  <>
                    <h4 className="text-gold font-sans font-bold tracking-[3px] uppercase text-sm mb-4">{typeInfo.title} • {typeInfo.subtitle}</h4>
                    <p className="text-dark font-medium leading-relaxed antialiased">{typeInfo.description}</p>
                  </>
                ) : (
                  <p className="text-grey italic">Detailed personality type information is not available for this profile.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
                {results?.mbti && results.mbti.length >= 4 ? (
                  [
                    { char: results.mbti[0], label: results.mbti[0] === 'E' ? 'Extraverted' : 'Introverted' },
                    { char: results.mbti[1], label: results.mbti[1] === 'S' ? 'Sensing' : 'Intuitive' },
                    { char: results.mbti[2], label: results.mbti[2] === 'T' ? 'Thinking' : 'Feeling' },
                    { char: results.mbti[3], label: results.mbti[3] === 'J' ? 'Judging' : 'Perceiving' },
                  ].map((dim, i) => (
                    <div key={i} className="bg-warm p-3 border border-gold/5 text-center min-w-[100px]">
                      <div className="text-navy text-2xl font-bold italic">{dim.char}</div>
                      <div className="text-gold text-[7px] font-bold tracking-[1px] uppercase">{dim.label}</div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-grey text-[10px] italic">Dimensions not available</div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 border-t border-gold/10 pt-8">
              {typeInfo ? (
                <>
                  <div className="space-y-6">
                    <div>
                      <h5 className="text-navy font-sans font-bold text-[10px] tracking-[3px] uppercase mb-4 border-b border-gold/20 pb-2">Key Strengths</h5>
                      <ul className="space-y-2">
                        {typeInfo.strengths?.map((s: string, i: number) => (
                          <li key={i} className="flex gap-2 text-sm text-dark font-medium">
                            <span className="text-gold">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-navy font-sans font-bold text-[10px] tracking-[3px] uppercase mb-4 border-b border-gold/20 pb-2">Professional Environment</h5>
                      <p className="text-sm text-dark font-medium leading-relaxed italic">{typeInfo.workplace}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h5 className="text-navy font-sans font-bold text-[10px] tracking-[3px] uppercase mb-4 border-b border-gold/20 pb-2">Potential Challenges</h5>
                      <ul className="space-y-2">
                        {typeInfo.challenges?.map((c: string, i: number) => (
                          <li key={i} className="flex gap-2 text-sm text-dark font-medium">
                            <span className="text-gold">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-navy font-sans font-bold text-[10px] tracking-[3px] uppercase mb-4 border-b border-gold/20 pb-2">Development Pathway</h5>
                      <p className="text-sm text-dark font-medium leading-relaxed italic">{typeInfo.growth}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-2 text-center py-8 text-grey italic">
                  Additional behavioral insights are only available for standard MBTI types.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mb-16 break-inside-avoid">
          <h2 className="section-label">Section 2 • Big Five Clinical Data</h2>
          <div className="overflow-x-auto">
            {results?.bigFive ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-navy text-white font-sans text-[9px] tracking-[3px] uppercase">
                    <th className="p-4 text-left">Trait</th>
                    <th className="p-4 text-left">Score</th>
                    <th className="p-4 text-left">Interpretation</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-sm">
                  {[
                    { trait: 'Openness', score: results?.bigFive?.openness || 0, desc: 'Intellectual curiosity and systems thinking' },
                    { trait: 'Conscientiousness', score: results?.bigFive?.conscientiousness || 0, desc: 'Drive, self-discipline, and execution focus' },
                    { trait: 'Extraversion', score: results?.bigFive?.extraversion || 0, desc: 'Social energy and outward orientation' },
                    { trait: 'Agreeableness', score: results?.bigFive?.agreeableness || 0, desc: 'Focus on harmony vs independent principle' },
                    { trait: 'Emotional Stability', score: results?.bigFive?.emotionalStability || 0, desc: 'Internal sensitivity and stress resilience' },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-warm'}>
                      <td className="p-4 font-bold text-navy antialiased">{row.trait}</td>
                      <td className="p-4 text-gold font-bold antialiased">{row.score}th Percentile</td>
                      <td className="p-4 text-dark font-semibold antialiased">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center py-10 text-grey italic">Big Five data not available for this profile.</p>
            )}
          </div>
        </section>

        <section className="mb-16 break-inside-avoid">
          <h2 className="section-label">Section 3 • Emotional Intelligence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results?.ei ? (
              [
                { icon: <ShieldCheck />, label: 'Self-Awareness', score: results?.ei?.selfAwareness || 0 },
                { icon: <Zap />, label: 'Self-Regulation', score: results?.ei?.selfRegulation || 0 },
                { icon: <Brain />, label: 'Motivation', score: results?.ei?.motivation || 0 },
                { icon: <Info />, label: 'Empathy', score: results?.ei?.empathy || 0 },
                { icon: <FileText />, label: 'Social Skills', score: results?.ei?.socialSkills || 0 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-warm p-6 border-l-4 border-navy">
                  <div className="text-gold">{item.icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-sans text-[10px] font-bold tracking-wider uppercase text-grey">{item.label}</span>
                      <span className="font-sans text-xs font-bold text-navy">{item.score}%</span>
                    </div>
                    <div className="h-1 w-full bg-navy/10 rounded-full overflow-hidden">
                      <div className="h-full bg-navy" style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-2 text-center py-10 text-grey italic">Emotional Intelligence data not available.</p>
            )}
          </div>
        </section>

        <section className="bg-navy p-10 text-center">
          <h4 className="font-sans text-[10px] font-bold tracking-[5px] text-gold uppercase mb-4">Profile Integrity</h4>
          <p className="text-gold-lt italic text-lg max-w-2xl mx-auto font-medium">
            "The consistency of results across three independent methodological approaches distinguishes this profile from a single-instrument result."
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
