// Simple Cloudflare Worker for PDF Reader Backend

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Upload endpoint
    if (url.pathname === '/upload' && request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('pdf');
        
        if (!file) {
          return new Response(JSON.stringify({ error: 'No file provided' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const fileId = crypto.randomUUID();
        
        // Extract text from PDF
        const arrayBuffer = await file.arrayBuffer();
        const extractedText = await extractTextFromPDF(arrayBuffer);
        
        // Create metadata
        const metadata = {
          fileId,
          fileName: file.name,
          size: file.size,
          uploadTime: new Date().toISOString(),
          extractedText
        };
        
        // Store in KV
        await env.PDF_STORAGE.put(fileId, JSON.stringify(metadata));
        
        return new Response(JSON.stringify({
          message: 'File uploaded successfully',
          fileId,
          pages: extractedText.pages.length,
          embeddings_created: false,
          document_domain: 'general'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Upload error:', error);
        return new Response(JSON.stringify({ error: `Error processing PDF: ${error.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Ask question endpoint
    if (url.pathname === '/ask' && request.method === 'POST') {
      try {
        const { question, fileId } = await request.json();
        
        if (!question || !fileId) {
          return new Response(JSON.stringify({ error: 'Question and fileId required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get metadata
        const metadataStr = await env.PDF_STORAGE.get(fileId);
        if (!metadataStr) {
          return new Response(JSON.stringify({ error: 'File not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const metadata = JSON.parse(metadataStr);
        
        // Simple answer using OpenAI
        const answer = await answerQuestion(question, metadata.extractedText, env);
        
        return new Response(JSON.stringify({
          answer,
          cited_pages: [1],
          method: 'simple',
          context: metadata.extractedText.pages[0]?.text || '',
          pages_used: [1]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get extracted text
    if (url.pathname.startsWith('/extracted-text/') && request.method === 'GET') {
      try {
        const fileId = url.pathname.split('/')[2];
        
        const metadataStr = await env.PDF_STORAGE.get(fileId);
        if (!metadataStr) {
          return new Response(JSON.stringify({ error: 'File not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const metadata = JSON.parse(metadataStr);
        
        return new Response(JSON.stringify({
          total_pages: 1,
          total_text_length: metadata.extractedText.totalLength || 0,
          extraction_method: 'Demo',
          pages: metadata.extractedText.pages
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Model config endpoints
    if (url.pathname === '/api/models/config') {
      const config = {
        llm: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.1,
          max_tokens: 1000
        },
        embedding: {
          provider: 'openai',
          model: 'text-embedding-ada-002'
        }
      };
      
      return new Response(JSON.stringify(config), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Default response
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

// Basic PDF text extraction for Cloudflare Workers
async function extractTextFromPDF(arrayBuffer) {
  try {
    // Convert ArrayBuffer to Uint8Array for easier manipulation
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Basic PDF structure parsing
    // Look for text objects and streams in the PDF
    const pdfText = await extractTextFromPDFBytes(uint8Array);
    
    if (pdfText && pdfText.trim().length > 0) {
      return {
        pages: [{
          page_num: 1,
          text: pdfText.trim(),
          text_blocks: [{
            text: pdfText.trim(),
            bbox: [0, 0, 612, 792], // Standard page size
            page: 1,
            extraction_method: 'basic-parser'
          }]
        }],
        totalLength: pdfText.length
      };
    } else {
      // If no text found, return helpful message
      return {
        pages: [{
          page_num: 1,
          text: "No readable text found in this PDF. This PDF may contain images, scanned text, or be password-protected. For better text extraction from image-based PDFs, please use the Python backend which includes OCR capabilities.",
          text_blocks: []
        }],
        totalLength: 150
      };
    }
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      pages: [{
        page_num: 1,
        text: `Error processing PDF: ${error.message}. Please try uploading a different PDF or use the Python backend for advanced PDF processing capabilities.`,
        text_blocks: []
      }],
      totalLength: 100
    };
  }
}

// Enhanced PDF text extraction from bytes
async function extractTextFromPDFBytes(uint8Array) {
  try {
    // Convert to string to search for text patterns
    const pdfString = new TextDecoder('latin1').decode(uint8Array);
    
    // Look for text objects in PDF
    const textMatches = [];
    
    // Pattern 1: Look for BT...ET blocks (text objects) - more comprehensive
    const btEtPattern = /BT\s+([\s\S]*?)\s+ET/g;
    let match;
    while ((match = btEtPattern.exec(pdfString)) !== null) {
      const textBlock = match[1];
      
      // Extract text from various PDF text operators
      const patterns = [
        /\(([^)]*)\)\s*Tj/g,           // Simple text show
        /\(([^)]*)\)\s*TJ/g,           // Text show with individual glyph positioning
        /\[([\s\S]*?)\]\s*TJ/g,        // Array of strings and numbers
        /<([0-9A-Fa-f]+)>\s*Tj/g,     // Hexadecimal strings
        /<([0-9A-Fa-f]+)>\s*TJ/g      // Hexadecimal strings with positioning
      ];
      
      patterns.forEach(pattern => {
        let patternMatch;
        while ((patternMatch = pattern.exec(textBlock)) !== null) {
          let text = patternMatch[1];
          if (text && text.trim()) {
            // Handle different text formats
            if (pattern.source.includes('<')) {
              // Convert hex to text
              text = hexToText(text);
            } else if (pattern.source.includes('[')) {
              // Extract strings from array format
              const stringMatches = text.match(/\(([^)]*)\)/g);
              if (stringMatches) {
                stringMatches.forEach(str => {
                  const cleanStr = str.replace(/[()]/g, '');
                  if (cleanStr.trim()) {
                    textMatches.push(cleanPDFText(cleanStr));
                  }
                });
              }
            } else {
              textMatches.push(cleanPDFText(text));
            }
          }
        }
      });
    }
    
    // Pattern 2: Look for stream objects that might contain text
    const streamPattern = /stream\s+([\s\S]*?)\s+endstream/g;
    while ((match = streamPattern.exec(pdfString)) !== null) {
      const streamContent = match[1];
      
      // Try to find readable text in streams
      const readableText = extractReadableText(streamContent);
      if (readableText) {
        textMatches.push(readableText);
      }
    }
    
    // Pattern 3: Look for direct text content (fallback)
    const directTextPattern = /\(([^)]{3,})\)/g;
    while ((match = directTextPattern.exec(pdfString)) !== null) {
      const text = match[1];
      if (text && text.trim().length > 2 && isReadableText(text)) {
        textMatches.push(cleanPDFText(text));
      }
    }
    
    // Remove duplicates and combine
    const uniqueTexts = [...new Set(textMatches)];
    let extractedText = uniqueTexts.join(' ').trim();
    
    // Clean up the text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .trim();
    
    return extractedText;
    
  } catch (error) {
    console.error('Error in PDF parsing:', error);
    return '';
  }
}

// Convert hexadecimal string to text
function hexToText(hex) {
  try {
    let text = '';
    for (let i = 0; i < hex.length; i += 2) {
      const hexPair = hex.substr(i, 2);
      const charCode = parseInt(hexPair, 16);
      if (charCode >= 32 && charCode <= 126) { // Printable ASCII
        text += String.fromCharCode(charCode);
      }
    }
    return text;
  } catch (error) {
    return '';
  }
}

// Check if text appears to be readable
function isReadableText(text) {
  const readableChars = text.match(/[a-zA-Z0-9\s]/g);
  return readableChars && readableChars.length > text.length * 0.7;
}

// Clean PDF text from escape sequences and formatting
function cleanPDFText(text) {
  return text
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .trim();
}

// Extract readable text from stream content
function extractReadableText(streamContent) {
  // Look for readable ASCII text in the stream
  const readablePattern = /[a-zA-Z0-9\s.,!?;:'"()-]{10,}/g;
  const matches = streamContent.match(readablePattern);
  
  if (matches && matches.length > 0) {
    return matches
      .filter(match => match.trim().length > 10)
      .join(' ')
      .trim();
  }
  
  return '';
}

// Simple question answering
async function answerQuestion(question, extractedText, env) {
  try {
    const openaiApiKey = env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return "OpenAI API key not configured. Please contact the administrator.";
    }

    const context = extractedText.pages.map(page => page.text).join('\n\n');
    
    // Check if we have meaningful content
    if (context.includes('No readable text found') || context.includes('Error processing PDF') || context.trim().length < 10) {
      return "Sorry, I couldn't extract readable text from this PDF. This may be because:\n\n• The PDF contains images or scanned text rather than selectable text\n• The PDF is password-protected\n• The PDF uses complex formatting that our basic parser can't handle\n\nFor better results with image-based PDFs, you would need OCR capabilities. This Cloudflare Worker version works best with text-based PDFs that contain selectable text.";
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that answers questions based on document content. Only use information from the provided document. If the document content seems incomplete or indicates extraction issues, explain this to the user.'
          },
          {
            role: 'user',
            content: `Document content:\n${context}\n\nQuestion: ${question}\n\nPlease answer based only on the document content provided above.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return `Sorry, there was an error processing your question. OpenAI API returned status ${response.status}. Please try again later.`;
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content;
    
    if (!answer) {
      return "Sorry, I couldn't generate an answer to your question. Please try rephrasing your question or check if the document was uploaded correctly.";
    }
    
    return answer;
    
  } catch (error) {
    console.error('Answer generation error:', error);
    return `Sorry, there was an error processing your question: ${error.message}. Please try again.`;
  }
}
