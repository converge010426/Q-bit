import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { AssessmentResults, typeDescriptions } from '../logic.js';
import { comprehensiveDescriptions } from '../comprehensiveDescriptions.js';
import settings from '../../CONVERGE_SETTINGS.json' with { type: 'json' };

const SYSTEM_VERSION = settings.SYSTEM_VERSION;

export async function generateMBTIReport(name: string, results: AssessmentResults): Promise<string> {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    bufferPages: true,
  });

  const reportsDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'reports');
  console.log(`[ReportService] Generating MBTI report for ${name}. Reports dir: ${reportsDir}`);
  try {
    if (!fs.existsSync(reportsDir)) {
      console.log(`[ReportService] Creating reports directory: ${reportsDir}`);
      fs.mkdirSync(reportsDir, { recursive: true });
    }
  } catch (err: any) {
    console.error(`[ReportService] Failed to create reports directory at ${reportsDir}:`, err.message);
    throw new Error(`FileSystem Error: ${err.message}`);
  }

  const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `MBTI_Report_${sanitizedName}_${Date.now()}.pdf`;
  const filePath = path.join(reportsDir, fileName);
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  // --- PAGE 1: SUMMARY ---
  // Branding Colors
  const navy = '#1a2b4b';
  const gold = '#c5a059';
  const dark = '#111111';
  const grey = '#444444';
  const lightGrey = '#f9f7f2';

  // Header
  doc
    .rect(0, 0, doc.page.width, 150)
    .fill(navy);

  doc
    .fillColor(gold)
    .fontSize(40)
    .font('Helvetica-Bold')
    .text('CONVERGE', 50, 50, { characterSpacing: 4 })
    .fontSize(10)
    .text('TM', doc.x + 220, 50);

  doc
    .fillColor('#ffffff')
    .fontSize(12)
    .font('Helvetica')
    .text('Integrated Psychological Insight Protocol', 50, 100, { characterSpacing: 1 });

  // Report Title
  doc
    .fillColor(dark)
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('MBTI PERSONALITY PROFILE', 50, 180);

  doc
    .fillColor(grey)
    .fontSize(10)
    .font('Helvetica-Oblique')
    .text('This protocol integrates MBTI, IPIP Big Five, and Emotional Intelligence frameworks to build a verified psychological architecture of your personality profile.', 50, 210, { width: 495, align: 'justify' });

  doc
    .moveTo(50, 240)
    .lineTo(545, 240)
    .strokeColor(gold)
    .lineWidth(1)
    .stroke();

  // Candidate Info
  doc
    .fillColor(grey)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('CANDIDATE NAME', 50, 260, { characterSpacing: 2 })
    .fillColor(navy)
    .fontSize(18)
    .text(name.toUpperCase(), 50, 275);

  doc
    .fillColor(grey)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('ASSESSMENT DATE', 350, 260, { characterSpacing: 2 })
    .fillColor(navy)
    .fontSize(14)
    .text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), 350, 275);

  // MBTI Type Result
  const typeInfo = typeDescriptions[results.mbti];
  
  doc
    .rect(50, 330, 495, 120)
    .fill(lightGrey);

  doc
    .fillColor(navy)
    .fontSize(60)
    .font('Helvetica-Bold')
    .text(results.mbti, 70, 350);

  doc
    .fillColor(gold)
    .fontSize(18)
    .font('Helvetica-BoldOblique')
    .text(`${typeInfo.title} • ${typeInfo.subtitle}`, 240, 355);

  doc
    .fillColor(grey)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('VERIFIED PSYCHOLOGICAL ARCHITECTURE', 240, 395, { characterSpacing: 1 });

  // Description
  doc
    .fillColor(dark)
    .fontSize(11)
    .font('Helvetica')
    .text(typeInfo.description, 50, 480, {
      align: 'justify',
      lineGap: 4,
      width: 495,
      height: 90, // Limit height to prevent overlap with dimensions
      ellipsis: true
    });

  // Dimensions
  const dimensions = [
    { char: results.mbti[0], label: results.mbti[0] === 'E' ? 'Extraverted' : 'Introverted' },
    { char: results.mbti[1], label: results.mbti[1] === 'S' ? 'Sensing' : 'Intuitive' },
    { char: results.mbti[2], label: results.mbti[2] === 'T' ? 'Thinking' : 'Feeling' },
    { char: results.mbti[3], label: results.mbti[3] === 'J' ? 'Judging' : 'Perceiving' },
  ];

  let xPos = 50;
  dimensions.forEach((dim) => {
    doc
      .rect(xPos, 600, 110, 80)
      .fill(lightGrey);
    
    doc
      .fillColor(navy)
      .fontSize(30)
      .font('Helvetica-BoldOblique')
      .text(dim.char, xPos + 20, 615);
    
    doc
      .fillColor(gold)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(dim.label.toUpperCase(), xPos + 20, 655, { characterSpacing: 1 });
    
    xPos += 128;
  });

  // Footer
  doc
    .fillColor(grey)
    .fontSize(8)
    .font('Helvetica')
    .text(`© ${new Date().getFullYear()} CONVERGE™ • PAGE 1`, 50, 780, { align: 'center' });

  // --- PAGE 2: DETAILED ANALYSIS ---
  doc.addPage();

  // Header (Small)
  doc
    .rect(0, 0, doc.page.width, 60)
    .fill(navy);
  
  doc
    .fillColor(gold)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('CONVERGE', 50, 20, { characterSpacing: 2 });

  doc
    .fillColor(dark)
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('CORE STRENGTHS & CHALLENGES', 50, 100);

  doc
    .moveTo(50, 125)
    .lineTo(545, 125)
    .strokeColor(gold)
    .lineWidth(1)
    .stroke();

  // Side-by-Side: Strengths and Challenges
  const colWidth = 230;
  const leftCol = 50;
  const rightCol = 315;
  let yStart = 150;

  // Strengths Header
  doc
    .fillColor(navy)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('KEY STRENGTHS', leftCol, yStart, { characterSpacing: 1 });

  // Challenges Header
  doc
    .text('POTENTIAL CHALLENGES', rightCol, yStart, { characterSpacing: 1 });

  let yPosLeft = yStart + 30;
  typeInfo.strengths.forEach((strength) => {
    doc
      .circle(leftCol + 5, yPosLeft + 5, 2)
      .fill(gold);
    
    doc
      .fillColor(dark)
      .fontSize(10)
      .font('Helvetica')
      .text(strength, leftCol + 15, yPosLeft, { width: colWidth - 20 });
    
    yPosLeft += 25;
  });

  let yPosRight = yStart + 30;
  typeInfo.challenges.forEach((challenge) => {
    doc
      .circle(rightCol + 5, yPosRight + 5, 2)
      .fill(gold);
    
    doc
      .fillColor(dark)
      .fontSize(10)
      .font('Helvetica')
      .text(challenge, rightCol + 15, yPosRight, { width: colWidth - 20 });
    
    yPosRight += 25;
  });

  // Behavioural Architecture
  const yArch = Math.min(Math.max(yPosLeft, yPosRight) + 40, 620);
  doc
    .fillColor(navy)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('BEHAVIOURAL ARCHITECTURE', 50, yArch);

  doc
    .fillColor(dark)
    .fontSize(11)
    .font('Helvetica')
    .text(`As an ${results.mbti}, your psychological profile suggests a unique combination of ${dimensions[0].label.toLowerCase()} energy and ${dimensions[1].label.toLowerCase()} processing. This architecture manifests as a ${typeInfo.title.toLowerCase()} who values ${typeInfo.strengths[0].toLowerCase()} and ${typeInfo.strengths[1].toLowerCase()}. Your approach to problem-solving is defined by ${typeInfo.strengths[2].toLowerCase()}, which allows you to navigate complex professional landscapes with precision.`, 50, yArch + 30, {
      width: 495,
      align: 'justify',
      lineGap: 4,
      height: 90,
      ellipsis: true
    });

  // Footer
  doc
    .fillColor(grey)
    .fontSize(8)
    .font('Helvetica')
    .text(`© ${new Date().getFullYear()} CONVERGE™ • PAGE 2`, 50, 780, { align: 'center' });

  // --- PAGE 3: WORKPLACE & GROWTH ---
  doc.addPage();

  // Header (Small)
  doc
    .rect(0, 0, doc.page.width, 60)
    .fill(navy);
  
  doc
    .fillColor(gold)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('CONVERGE', 50, 20, { characterSpacing: 2 });

  doc
    .fillColor(dark)
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('WORKPLACE DYNAMICS & GROWTH', 50, 100);

  doc
    .moveTo(50, 125)
    .lineTo(545, 125)
    .strokeColor(gold)
    .lineWidth(1)
    .stroke();

  // Side-by-Side: Workplace and Growth
  yStart = 150;

  doc
    .fillColor(navy)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('PROFESSIONAL ENVIRONMENT', leftCol, yStart, { characterSpacing: 1 });

  doc
    .text('DEVELOPMENT PATHWAY', rightCol, yStart, { characterSpacing: 1 });

  doc
    .fillColor(dark)
    .fontSize(10)
    .font('Helvetica')
    .text(typeInfo.workplace, leftCol, yStart + 30, {
      width: colWidth,
      align: 'justify',
      lineGap: 4
    });

  doc
    .text(typeInfo.growth, rightCol, yStart + 30, {
      width: colWidth,
      align: 'justify',
      lineGap: 4
    });

  // Final Verdict
  doc
    .rect(50, 450, 495, 150)
    .fill(lightGrey);

  doc
    .fillColor(navy)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('CONVERGE™ INTEGRATED VERDICT', 70, 470, { characterSpacing: 1 });

  doc
    .fillColor(dark)
    .fontSize(11)
    .font('Helvetica-Oblique')
    .text(`The ${results.mbti} profile represents a highly consistent psychological structure. In the context of the CONVERGE™ protocol, this result serves as the foundational layer for your integrated personality architecture. This assessment integrates MBTI typology with IPIP Big Five clinical data and Emotional Intelligence metrics to provide a verified representation of current psychological predispositions.`, 70, 500, {
      width: 455,
      align: 'justify',
      lineGap: 4
    });

  // Footer
  doc
    .fillColor(grey)
    .fontSize(8)
    .font('Helvetica')
    .text(`© ${new Date().getFullYear()} CONVERGE™ • PAGE 3`, 50, 780, { align: 'center' });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

export async function generateComprehensiveReport(name: string, results: AssessmentResults, isRecruiter: boolean = false, jobData?: any): Promise<string> {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    bufferPages: true,
  });

  const reportsDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'reports');
  console.log(`[ReportService] Generating Comprehensive report for ${name}. Reports dir: ${reportsDir}`);
  try {
    if (!fs.existsSync(reportsDir)) {
      console.log(`[ReportService] Creating reports directory: ${reportsDir}`);
      fs.mkdirSync(reportsDir, { recursive: true });
    }
  } catch (err: any) {
    console.error(`[ReportService] Failed to create reports directory at ${reportsDir}:`, err.message);
    throw new Error(`FileSystem Error: ${err.message}`);
  }

  const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const reportType = isRecruiter ? 'Candidate_Suitability' : 'Comprehensive';
  const fileName = `${reportType}_Report_${sanitizedName}_${Date.now()}.pdf`;
  const filePath = path.join(reportsDir, fileName);
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  // Branding Colors
  const navy = '#1a2b4b';
  const gold = '#c5a059';
  const dark = '#111111';
  const grey = '#444444';
  const lightGrey = '#f9f7f2';

  // --- PAGE 1: COVER ---
  doc
    .rect(0, 0, doc.page.width, doc.page.height)
    .fill(navy);

  doc
    .fillColor(gold)
    .fontSize(60)
    .font('Helvetica-Bold')
    .text('CONVERGE', 50, 200, { characterSpacing: 8 })
    .fontSize(15)
    .text('TM', doc.x + 380, 200);

  doc
    .fillColor('#ffffff')
    .fontSize(20)
    .font('Helvetica')
    .text(isRecruiter ? 'CANDIDATE SUITABILITY ASSESSMENT' : 'COMPREHENSIVE PERSONALITY ASSESSMENT', 50, 280, { characterSpacing: 2 });

  doc
    .moveTo(50, 320)
    .lineTo(545, 320)
    .strokeColor(gold)
    .lineWidth(2)
    .stroke();

  doc
    .fillColor(gold)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('PREPARED FOR:', 50, 450, { characterSpacing: 2 })
    .fillColor('#ffffff')
    .fontSize(30)
    .text(name.toUpperCase(), 50, 475);

  doc
    .fillColor(gold)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('DATE:', 50, 550, { characterSpacing: 2 })
    .fillColor('#ffffff')
    .fontSize(20)
    .text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), 50, 575);

  doc
    .fillColor(gold)
    .fontSize(10)
    .font('Helvetica')
    .text('© CONVERGE™ • INTEGRATED PSYCHOLOGICAL INSIGHT PROTOCOL', 50, 750);

  // --- PAGE 2: INTRODUCTION ---
  doc.addPage();
  
  doc
    .rect(0, 0, doc.page.width, 100)
    .fill(navy);

  doc
    .fillColor(gold)
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('INTRODUCTION', 50, 40, { characterSpacing: 2 });

  if (isRecruiter) {
    doc
      .fillColor('#ffffff')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('CANDIDATE SUITABILITY REPORT', 50, 75, { characterSpacing: 1 });
  }

  doc
    .fillColor(dark)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('The Converge Methodology', 50, 130);

  doc
    .fillColor(dark)
    .fontSize(11)
    .font('Helvetica')
    .text(isRecruiter 
      ? 'The Converge Candidate Suitability Assessment is a multi-dimensional psychological protocol designed for hiring managers to evaluate a candidate\'s fit within a specific organizational context. It integrates three of the most robust frameworks in modern personality science: the Myers-Briggs Type Indicator (MBTI), the IPIP Big Five Factor Model, and Emotional Intelligence (EQ) metrics.'
      : 'The Converge Comprehensive Assessment is a multi-dimensional psychological protocol that integrates three of the most robust frameworks in modern personality science: the Myers-Briggs Type Indicator (MBTI), the IPIP Big Five Factor Model, and Emotional Intelligence (EQ) metrics.', 
      50, 160, { width: 495, align: 'justify', lineGap: 4 });

  doc
    .text(isRecruiter
      ? 'By converging these three distinct perspectives, we provide recruiters and HR professionals with a verified psychological architecture of the candidate. This report explores their cognitive preferences, behavioral tendencies, and emotional capacities to provide a complete picture of how they will navigate the workplace, interact with team members, and manage professional challenges.'
      : 'By converging these three distinct perspectives, we move beyond simple labels to provide a verified psychological architecture of your personality. This report explores your cognitive preferences, your behavioral tendencies, and your emotional capacities to give you a complete picture of how you navigate the world, interact with others, and manage your internal state.', 
      50, 220, { width: 495, align: 'justify', lineGap: 4 });

  // Frameworks Table
  const frameworks = [
    { title: 'MBTI', desc: 'Cognitive preferences and mental models.' },
    { title: 'BIG FIVE', desc: 'Core personality traits and behavioral patterns.' },
    { title: 'EQ', desc: 'Emotional awareness and interpersonal effectiveness.' }
  ];

  let yPos = 320;
  frameworks.forEach(f => {
    doc
      .rect(50, yPos, 100, 60)
      .fill(lightGrey);
    
    doc
      .fillColor(navy)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(f.title, 65, yPos + 20);
    
    doc
      .fillColor(dark)
      .fontSize(10)
      .font('Helvetica')
      .text(f.desc, 165, yPos + 25, { width: 380 });
    
    yPos += 75;
  });

  // --- PAGE 3: MBTI DEEP DIVE ---
  doc.addPage();
  
  doc
    .rect(0, 0, doc.page.width, 100)
    .fill(navy);

  doc
    .fillColor(gold)
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('MBTI ARCHITECTURE', 50, 40, { characterSpacing: 2 });

  const compDesc = comprehensiveDescriptions[results.mbti] || {
    introduction: typeDescriptions[results.mbti].description,
    strengths: typeDescriptions[results.mbti].strengths,
    challenges: typeDescriptions[results.mbti].challenges,
    workplace: { asLeader: "N/A", asColleague: "N/A", asSubordinate: "N/A" },
    growth: [typeDescriptions[results.mbti].growth]
  };

  doc
    .fillColor(navy)
    .fontSize(40)
    .font('Helvetica-Bold')
    .text(results.mbti, 50, 130);

  doc
    .fillColor(gold)
    .fontSize(18)
    .font('Helvetica-BoldOblique')
    .text(typeDescriptions[results.mbti].title, 180, 145);

  doc
    .fillColor(dark)
    .fontSize(11)
    .font('Helvetica')
    .text(compDesc.introduction, 50, 200, { width: 495, align: 'justify', lineGap: 4 });

  doc
    .fillColor(navy)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Core Strengths', 50, 320);

  yPos = 345;
  compDesc.strengths.forEach(s => {
    doc
      .circle(55, yPos + 5, 2)
      .fill(gold);
    doc
      .fillColor(dark)
      .fontSize(10)
      .font('Helvetica')
      .text(s, 65, yPos, { width: 480 });
    yPos += 25;
  });

  doc
    .fillColor(navy)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Potential Challenges', 50, yPos + 20);

  yPos += 45;
  compDesc.challenges.forEach(c => {
    doc
      .circle(55, yPos + 5, 2)
      .fill(gold);
    doc
      .fillColor(dark)
      .fontSize(10)
      .font('Helvetica')
      .text(c, 65, yPos, { width: 480 });
    yPos += 25;
  });

  // --- PAGE 4: WORKPLACE & GROWTH ---
  doc.addPage();
  
  doc
    .rect(0, 0, doc.page.width, 100)
    .fill(navy);

  doc
    .fillColor(gold)
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('WORKPLACE & GROWTH', 50, 40, { characterSpacing: 2 });

  // Workplace Dynamics Fallback
  const workplaceDynamics = compDesc.workplace || {
    asLeader: `As a leader, this ${results.mbti} profile tends to be ${results.mbti.includes('J') ? 'highly organized and goal-oriented' : 'flexible and adaptive'}. They focus on ${results.mbti.includes('T') ? 'logical outcomes' : 'team harmony'} and expect excellence from their team.`,
    asColleague: `As a colleague, they are likely ${results.mbti.includes('E') ? 'collaborative and outgoing' : 'focused and independent'}. They value ${results.mbti.includes('S') ? 'practicality' : 'innovation'} in their professional relationships.`,
    asSubordinate: `As a subordinate, they work best when given ${results.mbti.includes('J') ? 'clear structure' : 'creative freedom'}. They respect competence and are motivated by ${results.mbti.includes('F') ? 'appreciation' : 'results'}.`
  };

  doc
    .fillColor(navy)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Workplace Dynamics', 50, 130);

  doc
    .fillColor(gold)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('AS A LEADER', 50, 155)
    .fillColor(dark)
    .font('Helvetica')
    .text(workplaceDynamics.asLeader, 50, 170, { width: 495, lineGap: 2 });

  doc
    .fillColor(gold)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('AS A COLLEAGUE', 50, 240)
    .fillColor(dark)
    .font('Helvetica')
    .text(workplaceDynamics.asColleague, 50, 255, { width: 495, lineGap: 2 });

  doc
    .fillColor(gold)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('AS A SUBORDINATE', 50, 325)
    .fillColor(dark)
    .font('Helvetica')
    .text(workplaceDynamics.asSubordinate, 50, 340, { width: 495, lineGap: 2 });

  doc
    .fillColor(navy)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Development Pathway', 50, 420);

  yPos = 445;
  compDesc.growth.forEach(g => {
    doc
      .circle(55, yPos + 5, 2)
      .fill(gold);
    doc
      .fillColor(dark)
      .fontSize(10)
      .font('Helvetica')
      .text(g, 65, yPos, { width: 480 });
    yPos += 25;
  });

  // --- PAGE 5: BIG FIVE & EQ ---
  doc.addPage();
  
  doc
    .rect(0, 0, doc.page.width, 100)
    .fill(navy);

  doc
    .fillColor(gold)
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('BEHAVIORAL & EMOTIONAL METRICS', 50, 40, { characterSpacing: 2 });

  // Big Five Section
  doc
    .fillColor(navy)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('IPIP Big Five Factor Model', 50, 130);

  const bigFiveData = [
    { label: 'Openness', score: results.bigFive.openness, desc: 'Curiosity, creativity, and openness to new experiences.' },
    { label: 'Conscientiousness', score: results.bigFive.conscientiousness, desc: 'Organization, dependability, and discipline.' },
    { label: 'Extraversion', score: results.bigFive.extraversion, desc: 'Sociability, assertiveness, and emotional expressiveness.' },
    { label: 'Agreeableness', score: results.bigFive.agreeableness, desc: 'Trust, altruism, and kindness.' },
    { label: 'Neuroticism', score: results.bigFive.emotionalStability, desc: 'Emotional stability and impulse control.' }
  ];

  yPos = 160;
  bigFiveData.forEach(trait => {
    doc
      .fillColor(dark)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(trait.label.toUpperCase(), 50, yPos);
    
    // Progress Bar
    doc
      .rect(50, yPos + 15, 495, 10)
      .fill(lightGrey);
    doc
      .rect(50, yPos + 15, (trait.score / 100) * 495, 10)
      .fill(gold);
    
    doc
      .fillColor(grey)
      .fontSize(8)
      .font('Helvetica')
      .text(trait.desc, 50, yPos + 30);
    
    yPos += 55;
  });

  // EQ Section
  doc
    .fillColor(navy)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('Emotional Intelligence (EQ)', 50, yPos + 20);

  const eqData = [
    { label: 'Self-Awareness', score: results.ei.selfAwareness },
    { label: 'Self-Regulation', score: results.ei.selfRegulation },
    { label: 'Motivation', score: results.ei.motivation },
    { label: 'Empathy', score: results.ei.empathy },
    { label: 'Social Skills', score: results.ei.socialSkills }
  ];

  yPos += 50;
  eqData.forEach(trait => {
    doc
      .fillColor(dark)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(trait.label.toUpperCase(), 50, yPos);
    
    doc
      .rect(50, yPos + 15, 495, 10)
      .fill(lightGrey);
    doc
      .rect(50, yPos + 15, (trait.score / 100) * 495, 10)
      .fill(navy);
    
    yPos += 40;
  });

  // --- RECRUITER SECTION (IF APPLICABLE) ---
  if (isRecruiter) {
    doc.addPage();
    
    doc
      .rect(0, 0, doc.page.width, 100)
      .fill(navy);

    doc
      .fillColor(gold)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('SUITABILITY ANALYSIS', 50, 40, { characterSpacing: 2 });

    doc
      .fillColor(dark)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Role Definition', 50, 130);

    // Job Context Box
    doc
      .rect(50, 155, 495, 100)
      .fill(lightGrey);

    doc
      .fillColor(grey)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('TARGET POSITION', 65, 170, { characterSpacing: 1 })
      .fillColor(navy)
      .fontSize(14)
      .text(jobData?.jobTitle?.toUpperCase() || 'NOT SPECIFIED', 65, 185);

    doc
      .fillColor(grey)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('ENVIRONMENT', 300, 170, { characterSpacing: 1 })
      .fillColor(navy)
      .fontSize(12)
      .text(jobData?.jobEnvironment || 'NOT SPECIFIED', 300, 185);

    doc
      .fillColor(grey)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('KEY CHALLENGE', 65, 220, { characterSpacing: 1 })
      .fillColor(dark)
      .fontSize(10)
      .font('Helvetica')
      .text(jobData?.jobChallenge || 'NOT SPECIFIED', 65, 235);

    doc
      .fillColor(navy)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Executive Summary for Hiring Managers', 50, 280);
    
    doc
      .fillColor(dark)
      .font('Helvetica')
      .fontSize(10)
      .text(`Candidate ${name} presents a robust ${results.mbti} profile, characterized by high-level cognitive agility and ${results.mbti.includes('J') ? 'structured execution' : 'adaptive problem-solving'}. In the context of a ${jobData?.jobEnvironment || 'professional'} environment, their natural tendencies suggest a strong alignment with roles requiring ${results.mbti.includes('T') ? 'analytical rigor' : 'interpersonal empathy'}.`, 50, 305, { width: 495, lineGap: 4, align: 'justify' });
    
    doc
      .fillColor(navy)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Suitability Indicators', 50, 370);
    
    const suitabilityPoints = [
      { label: 'Leadership Potential', value: results.ei.socialSkills > 70 ? 'High' : 'Moderate', detail: results.ei.socialSkills > 70 ? 'Natural influencer' : 'Individual contributor focus' },
      { label: 'Stress Tolerance', value: results.ei.selfRegulation > 65 ? 'Stable' : 'Adaptive', detail: results.ei.selfRegulation > 65 ? 'High resilience' : 'Needs supportive environment' },
      { label: 'Strategic Thinking', value: results.mbti.includes('N') ? 'Exceptional' : 'Practical', detail: results.mbti.includes('N') ? 'Future oriented' : 'Detail oriented' },
      { label: 'Team Collaboration', value: results.mbti.includes('E') ? 'Active' : 'Focused', detail: results.mbti.includes('E') ? 'Energized by groups' : 'Focused - Prefers deep work' }
    ];
    
    let suitY = 400;
    suitabilityPoints.forEach(point => {
      doc
        .fillColor(dark)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(point.label + ':', 50, suitY);
      
      doc
        .fillColor(gold)
        .text(point.value, 180, suitY);
      
      doc
        .fillColor(grey)
        .font('Helvetica')
        .text(' — ' + point.detail, doc.x + 5, suitY);
      
      suitY += 25;
    });
    
    doc
      .fillColor(navy)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Role-Specific Recommendation', 50, suitY + 20);
    
    doc
      .fillColor(dark)
      .font('Helvetica')
      .fontSize(10)
      .text(`Based on the integrated psychological architecture and the defined challenge (${jobData?.jobChallenge || 'standard operations'}), this candidate is ${results.ei.selfAwareness > 60 ? 'highly recommended' : 'recommended with support'} for the ${jobData?.jobTitle || 'position'}. Their ${results.mbti.includes('J') ? 'systematic organization' : 'flexible innovation'} will be a key asset in managing the ${jobData?.jobEnvironment || 'workplace'} dynamics.`, 50, suitY + 45, { width: 495, lineGap: 4, align: 'justify' });
  }

  // Footer on all pages
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc
      .fillColor(grey)
      .fontSize(8)
      .font('Helvetica')
      .text(`© ${new Date().getFullYear()} CONVERGE™ • SYSTEM ${SYSTEM_VERSION} • PAGE ${i + 1}`, 50, 780, { align: 'center' });
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}
