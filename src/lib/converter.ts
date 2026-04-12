import * as pdfjsLib from 'pdfjs-dist';
// Use the browser-ready version of mammoth
import mammoth from 'mammoth/mammoth.browser';

// Set worker path - using a CDN that matches the version
// Note: In a production app, you might want to bundle the worker or use a more robust loading method.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

export interface ConversionResult {
  data: string | Blob;
  fileName: string;
  type: 'text' | 'image';
}

export async function convertPdfToText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText;
}

export async function convertPdfToImages(file: File, scale = 2): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const images: Blob[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
    
    const blob = await new Promise<Blob | null>((resolve) => 
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.8)
    );
    
    if (blob) images.push(blob);
  }
  
  return images;
}

export async function convertTextToImage(text: string, fileName: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Basic text rendering to canvas
  const padding = 40;
  const fontSize = 16;
  const lineHeight = 24;
  const maxWidth = 800;
  
  ctx.font = `${fontSize}px Inter, sans-serif`;
  
  // Wrap text
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth - padding * 2) {
      lines.push(currentLine);
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  canvas.width = maxWidth;
  canvas.height = lines.length * lineHeight + padding * 2;
  
  // Re-fill background and text
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#000000';
  ctx.font = `${fontSize}px Inter, sans-serif`;
  ctx.textBaseline = 'top';
  
  lines.forEach((line, i) => {
    ctx.fillText(line, padding, padding + i * lineHeight);
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas to Blob failed'));
    }, 'image/jpeg', 0.9);
  });
}

export async function convertWordToText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Mammoth conversion error:', error);
    throw new Error('Failed to extract text from Word document. Ensure it is a valid .docx file.');
  }
}
