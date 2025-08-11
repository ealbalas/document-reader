import os
import re
import tempfile
import time
from typing import Dict, List, Tuple

import chromadb
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
import fitz  # PyMuPDF
import google.generativeai as genai
from config import AVAILABLE_MODELS, model_config
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI
from sentence_transformers import SentenceTransformer
from werkzeug.utils import secure_filename

# Load environment variables
load_dotenv()

app = Flask(__name__)

# CORS Configuration
# Allow the specific Vercel frontend and localhost for development
FRONTEND_ORIGIN_PROD = (
    "https://document-reader-gaq43cdf3-emad-albalas-projects.vercel.app"
)
FRONTEND_ORIGIN_DEV = "http://localhost:3000"

# Check if in development mode
is_development = os.environ.get("FLASK_ENV") == "development"

origins = [FRONTEND_ORIGIN_PROD]
if is_development:
    origins.append(FRONTEND_ORIGIN_DEV)

CORS(
    app,
    resources={r"/*": {"origins": origins}},
    supports_credentials=False,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    methods=["GET", "POST", "OPTIONS"],
    expose_headers=["Content-Length", "Content-Range"],
    max_age=86400,
)

# Configuration - Increased file size limit for larger PDFs
app.config["MAX_CONTENT_LENGTH"] = 150 * 1024 * 1024  # 150MB max file size
UPLOAD_FOLDER = tempfile.mkdtemp()
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Initialize Gemini API
gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    print("Gemini API configured successfully")
else:
    print("Warning: GEMINI_API_KEY not found in environment variables")

# Initialize OpenAI API
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = None
if OPENAI_API_KEY:
    try:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        print("OpenAI API configured successfully")
    except Exception as e:
        print(f"Warning: Failed to initialize OpenAI client: {str(e)}")
        print(f"Error details: {type(e).__name__}: {str(e)}")
else:
    print("Warning: OPENAI_API_KEY not found in environment variables")

# Global variables to store current document
current_pdf_path = None
current_pdf_text = None
current_pdf_pages = []

# Initialize embedding model and vector database
embedding_model = None
chroma_client = None
collection = None


def detect_document_domain(text_sample: str) -> str:
    """Detect if document is medical, legal, or general based on terminology"""
    text_lower = text_sample.lower()

    # Medical terminology indicators
    medical_terms = [
        "patient",
        "diagnosis",
        "treatment",
        "medication",
        "doctor",
        "physician",
        "nurse",
        "hospital",
        "clinic",
        "medical",
        "surgery",
        "procedure",
        "symptoms",
        "condition",
        "prescription",
        "dosage",
        "therapy",
        "examination",
        "vital signs",
        "blood pressure",
        "heart rate",
        "temperature",
        "respiratory",
        "cardiovascular",
        "neurological",
        "pathology",
        "radiology",
        "laboratory",
        "discharge",
        "admission",
        "anesthesia",
        "post-operative",
        "pre-operative",
        "clinical",
        "healthcare",
        "medical record",
    ]

    # Legal terminology indicators
    legal_terms = [
        "contract",
        "agreement",
        "clause",
        "party",
        "parties",
        "plaintiff",
        "defendant",
        "court",
        "judge",
        "attorney",
        "lawyer",
        "legal",
        "law",
        "statute",
        "regulation",
        "compliance",
        "liability",
        "damages",
        "settlement",
        "litigation",
        "jurisdiction",
        "whereas",
        "therefore",
        "hereby",
        "witnesseth",
        "consideration",
        "covenant",
        "indemnify",
        "breach",
        "termination",
        "arbitration",
        "governing law",
        "venue",
    ]

    medical_count = sum(1 for term in medical_terms if term in text_lower)
    legal_count = sum(1 for term in legal_terms if term in text_lower)

    if medical_count > legal_count and medical_count >= 3:
        return "medical"
    elif legal_count > medical_count and legal_count >= 3:
        return "legal"
    else:
        return "general"

def initialize_embedding_system(document_domain: str = "general"):
    """Initialize the embedding model and vector database with configurable model"""
    global embedding_model, chroma_client, collection

    try:
        # Get embedding configuration
        embedding_config = model_config.get_embedding_config()
        provider = embedding_config["provider"]
        model_name = embedding_config["model"]

        print(f"      🔧 Configuration: {provider} provider, model: {model_name}")
       
        # Initialize ChromaDB
        print("      🗄️ Initializing ChromaDB vector database...")
        chroma_client = chromadb.Client()
        collection_name = f"pdf_documents_{document_domain}"

        # Choose embedding model based on document domain if using sentence-transformers
        if provider == "sentence-transformers":
            print(f"      📥 Loading sentence-transformers model: {model_name}...")
            # Initialize sentence transformer model
            embedding_model = SentenceTransformer(model_name)
            print("      ✅ Sentence-transformers model loaded successfully")
        elif provider == "openai":
            # For OpenAI embeddings, we'll handle this in a separate function
            print(f"      🔑 OpenAI embeddings configured with model: {model_name}")
            embedding_model = "openai"  # Placeholder
            collection = chroma_client.create_collection(
                name = collection_name,
                embedding_function= OpenAIEmbeddingFunction(
                    model_name=model_name
            ))
        else:
            print(f"      ❌ Unsupported embedding provider: {provider}")
            # Create or get collection with domain-specific name
            print(f"      📚 Setting up collection: {collection_name}")
            try:
                collection = chroma_client.get_collection(collection_name)
                print(f"      ♻️ Using existing collection: {collection_name}")
            except:
                collection = chroma_client.create_collection(collection_name)
                print(f"      🆕 Created new collection: {collection_name}")

        print(
            f"      ✅ Embedding system initialized successfully for {document_domain} domain"
        )
        return True
    except Exception as e:
        print(f"      ❌ Failed to initialize embedding system: {str(e)}")
        return False

def chunk_text(text: str, chunk_size: int = 300, overlap: int = 75) -> List[str]:
    """Split text into overlapping chunks for better context preservation with semantic boundaries"""
    import re

    # First, try to split by sentences for better semantic chunks
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks = []
    current_chunk = ""
    current_word_count = 0

    for sentence in sentences:
        sentence_words = len(sentence.split())

        # If adding this sentence would exceed chunk size, finalize current chunk
        if current_word_count + sentence_words > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())

            # Start new chunk with overlap from previous chunk
            overlap_words = current_chunk.split()[-overlap:] if overlap > 0 else []
            current_chunk = (
                " ".join(overlap_words) + " " + sentence if overlap_words else sentence
            )
            current_word_count = len(overlap_words) + sentence_words
        else:
            # Add sentence to current chunk
            current_chunk += " " + sentence if current_chunk else sentence
            current_word_count += sentence_words

    # Add the last chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    # Fallback to word-based chunking if sentence-based didn't work well
    if len(chunks) < 2 and len(text.split()) > chunk_size:
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i : i + chunk_size])
            if chunk.strip():
                chunks.append(chunk.strip())

    return chunks

def create_enhanced_chunks(pages_data: List[Dict]) -> List[Dict]:
    """Create enhanced chunks with multiple granularities and metadata"""
    enhanced_chunks = []

    for page_data in pages_data:
        page_text = page_data["text"]
        page_num = page_data["page_num"]

        if not page_text.strip():
            continue

        # 1. Full page chunk (for broad context)
        enhanced_chunks.append(
            {
                "id": f"page_{page_num}",
                "text": page_text,
                "page": page_num,
                "chunk_type": "full_page",
                "word_count": len(page_text.split()),
                "text_blocks": page_data["text_blocks"],
            }
        )

        # 2. Semantic chunks (sentence-based with overlap)
        semantic_chunks = chunk_text(page_text, chunk_size=300, overlap=75)
        for i, chunk in enumerate(semantic_chunks):
            if len(chunk.split()) > 10:  # Only include substantial chunks
                enhanced_chunks.append(
                    {
                        "id": f"semantic_{page_num}_{i}",
                        "text": chunk,
                        "page": page_num,
                        "chunk_type": "semantic",
                        "chunk_index": i,
                        "word_count": len(chunk.split()),
                        "text_blocks": page_data["text_blocks"],
                    }
                )

    return enhanced_chunks

def create_embeddings_for_document(pages_data: List[Dict]) -> bool:
    """Create enhanced embeddings with multiple granularities for better search"""
    global collection, embedding_model

    if not embedding_model or not collection:
        return False

    try:
        # Clear existing documents
        try:
            collection.delete(where={"page": {"$gte": 0}})
        except:
            pass

        # Create enhanced chunks with multiple granularities
        enhanced_chunks = create_enhanced_chunks(pages_data)

        documents = []
        metadatas = []
        ids = []

        print(f"Creating embeddings for {len(enhanced_chunks)} enhanced chunks...")

        for chunk in enhanced_chunks:
            if chunk["text"].strip() and len(chunk["text"].split()) > 5:
                documents.append(chunk["text"])

                metadata = {
                    "page": chunk["page"],
                    "chunk_type": chunk["chunk_type"],
                    "word_count": chunk["word_count"],
                    "text_blocks": str(chunk["text_blocks"]),
                }

                # Add chunk-specific metadata
                if "chunk_index" in chunk:
                    metadata["chunk_index"] = chunk["chunk_index"]

                metadatas.append(metadata)
                ids.append(chunk["id"])

        if documents:
            # Add documents to collection in batches for better performance
            batch_size = 100
            for i in range(0, len(documents), batch_size):
                batch_docs = documents[i : i + batch_size]
                batch_metas = metadatas[i : i + batch_size]
                batch_ids = ids[i : i + batch_size]
                collection.add(
                    documents=batch_docs, metadatas=batch_metas, ids=batch_ids
                )
            print(
                f"Created embeddings for {len(documents)} chunks across {len(pages_data)} pages"
            )
            return True

    except Exception as e:
        print(f"Error creating embeddings: {str(e)}")

    return False

def semantic_search(question: str, top_k: int = 5) -> List[Dict]:
    """Enhanced semantic search with multiple query strategies and result fusion"""
    global collection

    if not collection:
        return []

    try:
        print("\n=== SEMANTIC SEARCH ===")
        print(f"Question: {question}")
        print("=" * 50)

        # Direct question search
        results = collection.query(query_texts=[question], n_results=top_k)

        if not results.get("documents") or not results["documents"][0]:
            return []

        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results.get("distances", [[0] * len(documents)])[0]

        search_results = []
        for doc, metadata, distance in zip(documents, metadatas, distances):
            search_results.append(
                {
                    "text": doc,
                    "page": metadata.get("page", 0),
                    "metadata": metadata,
                    "distance": distance,
                    "similarity": 1 - distance if distance else 1.0,
                }
            )

        print(f"Found {len(search_results)} results")
        for i, result in enumerate(search_results):
            chunk_type = result["metadata"].get("chunk_type", "unknown")
            similarity = result["similarity"]
            print(
                f"  {i + 1}. Page {result['page']}, {chunk_type}, similarity: {similarity:.3f}"
            )

        print("=" * 50 + "\n")

        return search_results

    except Exception as e:
        print(f"Error in semantic search: {str(e)}")
        return []

def answer_question_with_openai(
    question: str, context_text: str, page_sources: List[int]
) -> str:
    """Use OpenAI models to answer questions based on context with configurable model selection"""
    global openai_client

    if not openai_client:
        raise Exception("OpenAI client not initialized")

    try:
        # Get LLM configuration
        llm_config = model_config.get_llm_config()

        # Note: We don't need to validate provider here since this function is called when OpenAI is needed

        # Use configured model
        model = llm_config["model"]
        temperature = llm_config["temperature"]
        max_tokens = llm_config["max_tokens"]

        print(f"Using OpenAI model: {model} for query: {question[:50]}...")

        # Create page source information
        page_info = ", ".join([f"Page {page}" for page in sorted(set(page_sources))])

        # Enhanced prompt
        prompt = f"""
        You are an expert document analyst. Based on the following document content from {page_info}, please answer the question with precision and accuracy.

        DOCUMENT CONTENT:
        {context_text}

        QUESTION: {question}

        INSTRUCTIONS:
        1. Answer based ONLY on the information provided in the document
        2. If the information is not in the document, state "The information is not available in the provided document"
        3. Be specific and cite exact details from the document
        4. For signatures, dates, names, or numbers, provide the EXACT text from the document
        5. Keep your answer concise but complete
        6. CRITICAL: End your answer with source citation in format: "(Source: Page X)" or "(Source: Pages X, Y, Z)"
        7. Use these specific page numbers: {page_info}

        ANSWER:
        """

        # Make the API call
        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise document analyst. Always cite your sources and only use information from the provided document.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=0.9,
        )

        answer = response.choices[0].message.content.strip()

        # Ensure source citation is included if not already present
        if "(Source:" not in answer and page_sources:
            if len(page_sources) == 1:
                answer += f" (Source: Page {page_sources[0]})"
            else:
                sorted_pages = sorted(set(page_sources))
                if len(sorted_pages) <= 3:
                    pages_str = ", ".join(map(str, sorted_pages))
                    answer += f" (Source: Pages {pages_str})"
                else:
                    answer += f" (Source: Pages {sorted_pages[0]}-{sorted_pages[-1]})"

        return answer

    except Exception as e:
        print(f"Error with OpenAI API: {str(e)}")
        raise e

def answer_question_with_gemini(
    question: str, context_text: str, page_sources: List[int]
) -> str:
    """Use Google Gemini API to answer questions based on context with configurable model"""
    try:
        # Get LLM configuration
        llm_config = model_config.get_llm_config()

        # Note: We don't need to validate provider here since this function is called when Gemini is needed

        # Use configured model
        model_name = llm_config["model"]
        print(f"Using Gemini model: {model_name} for query: {question[:50]}...")

        # Initialize the model with configured name
        model = genai.GenerativeModel(model_name)

        # Create page source information
        page_info = ", ".join([f"Page {page}" for page in sorted(set(page_sources))])

        # Create a prompt that includes the context and question
        prompt = f"""Based on the following document content from {page_info}, please answer the question accurately and concisely.

Document Content:
{context_text}

Question: {question}

Instructions:
- Answer based only on the information provided in the document
- If the answer is not in the document, say "The information is not available in the document"
- Be specific and cite relevant details from the document
- Keep the answer concise but complete
- If asked about signatures, dates, or names, provide the exact text from the document
- IMPORTANT: End your answer with a source citation in the format: "(Source: Page X)" or "(Source: Pages X, Y, Z)" based on where the information was found
- Use the page numbers from the context provided: {page_info}

Answer:"""

        # Generate response
        response = model.generate_content(prompt)
        answer = response.text.strip()

        # Ensure source citation is included if not already present
        if "(Source:" not in answer and page_sources:
            if len(page_sources) == 1:
                answer += f" (Source: Page {page_sources[0]})"
            else:
                sorted_pages = sorted(set(page_sources))
                if len(sorted_pages) <= 3:
                    pages_str = ", ".join(map(str, sorted_pages))
                    answer += f" (Source: Pages {pages_str})"
                else:
                    answer += f" (Source: Pages {sorted_pages[0]}-{sorted_pages[-1]})"

        return answer

    except Exception as e:
        print(f"Error with Gemini API: {str(e)}")
        return f"Error generating answer: {str(e)}"

def answer_question_with_embeddings(
    question: str, pages_data: List[Dict], context_text: str, page_sources: List[int]
) -> Tuple[str, List[Dict]]:
    """Answer questions using semantic search, embeddings, and OpenAI/Gemini APIs with smart fallbacks"""
    # Get configured LLM provider
    llm_config = model_config.get_llm_config()
    provider = llm_config["provider"]

    print(f"Using configured LLM provider: {provider}")

    # Try the configured provider first
    try:
        if provider == "openai" and openai_client:
            print(f"Using OpenAI with model: {llm_config['model']}")
            answer = answer_question_with_openai(question, context_text, page_sources)
        elif provider == "gemini" and gemini_api_key:
            print(f"Using Gemini with model: {llm_config['model']}")
            answer = answer_question_with_gemini(question, context_text, page_sources)
        else:
            raise Exception(f"Provider {provider} not available or not configured")

        return answer, []

    except Exception as e:
        print(f"Error with configured provider {provider}: {str(e)}")

        # Fallback logic
        if provider != "openai" and openai_client:
            try:
                print("Falling back to OpenAI...")
                answer = answer_question_with_openai(
                    question, context_text, page_sources
                )
                return answer, []
            except Exception as openai_error:
                print(f"OpenAI fallback failed: {str(openai_error)}")

        if provider != "gemini" and gemini_api_key:
            try:
                print("Falling back to Gemini...")
                answer = answer_question_with_gemini(
                    question, context_text, page_sources
                )
                return answer, []
            except Exception as gemini_error:
                print(f"Gemini fallback failed: {str(gemini_error)}")

    # Final fallback to pattern matching
    return answer_question_simple(question, pages_data)


def extract_text_from_pdf(pdf_path):
    """Enhanced text extraction from PDF with multiple methods and better OCR fallback"""
    doc = fitz.open(pdf_path)
    pages_data = []
    total_pages = len(doc)
    print(f"Document has {total_pages} pages")

    for page_num in range(total_pages):
        print(f"Processing page {page_num + 1}/{total_pages}...")
        page = doc.load_page(page_num)
        page_rect = page.rect

        # Extract text with structure
        text_dict = page.get_text("dict")
        page_text = ""
        text_blocks = []

        # Extract text blocks
        block_count = 0
        for block in text_dict["blocks"]:
            if "lines" in block:
                for line in block["lines"]:
                    line_text = ""
                    line_bbox = None

                    for span in line["spans"]:
                        text = span["text"]
                        if text and text.strip():
                            line_text += text
                            bbox = span["bbox"]

                            if line_bbox is None:
                                line_bbox = list(bbox)
                            else:
                                line_bbox[0] = min(line_bbox[0], bbox[0])
                                line_bbox[1] = min(line_bbox[1], bbox[1])
                                line_bbox[2] = max(line_bbox[2], bbox[2])
                                line_bbox[3] = max(line_bbox[3], bbox[3])

                    if line_text.strip() and line_bbox:
                        clean_text = line_text.strip()
                        text_blocks.append(
                            {
                                "text": clean_text,
                                "bbox": line_bbox,
                                "page": page_num + 1,
                                "page_width": page_rect.width,
                                "page_height": page_rect.height,
                                "extraction_method": "embedded",
                            }
                        )
                        page_text += clean_text + " "
                        block_count += 1

        # print(clean_text)

        # Fallback to simple text extraction if needed
        if len(page_text.strip()) < 50:
            print(
                f"      ⚠️ Low text content ({len(page_text.strip())} chars), trying simple extraction..."
            )
            simple_text = page.get_text()
            if len(simple_text.strip()) > len(page_text.strip()):
                print(
                    f"      🔄 Simple extraction yielded more text ({len(simple_text.strip())} chars)"
                )
                page_text = simple_text
                # Create simple text blocks
                lines = simple_text.split("\n")
                text_blocks = []
                line_height = page_rect.height / max(
                    len([l for l in lines if l.strip()]), 1
                )
                y_offset = 50

                for line in lines:
                    line = line.strip()
                    if line:
                        bbox = [
                            50,
                            y_offset,
                            page_rect.width - 50,
                            y_offset + line_height,
                        ]
                        text_blocks.append(
                            {
                                "text": line,
                                "bbox": bbox,
                                "page": page_num + 1,
                                "page_width": page_rect.width,
                                "page_height": page_rect.height,
                                "extraction_method": "simple",
                            }
                        )
                        y_offset += line_height
                print(f"      ✅ Created {len(text_blocks)} simple text blocks")

        pages_data.append(
            {
                "page_num": page_num + 1,
                "text": page_text.strip(),
                "text_blocks": text_blocks,
                "extraction_methods": ["embedded", "simple"],
            }
        )

        print(
            f"      📊 Page {page_num + 1} summary: {len(page_text.strip())} chars, {len(text_blocks)} blocks"
        )

    doc.close()
    # print(pages_data)
    return pages_data

def answer_question_simple(question, pages_data):
    """Simple rule-based question answering for demonstration"""
    question_lower = question.lower()
    all_text = " ".join([page["text"] for page in pages_data])

    # Simple keyword-based matching
    if "who signed" in question_lower or "signed by" in question_lower:
        # Look for signature patterns
        signature_patterns = [
            r"signed by ([A-Za-z\s]+(?:MD|Dr\.?|RN|NP))",
            r"signature[:\s]*([A-Za-z\s]+)",
            r"([A-Za-z\s]+(?:MD|Dr\.?|RN|NP))[,\s]*signature",
        ]

        for pattern in signature_patterns:
            matches = re.findall(pattern, all_text, re.IGNORECASE)
            if matches:
                answer = f"The document was signed by: {', '.join(matches)}"
                return answer, []

    elif "date" in question_lower or "when" in question_lower:
        # Look for date patterns
        date_patterns = [
            r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
            r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b",
            r"\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b",
        ]

        for pattern in date_patterns:
            matches = re.findall(pattern, all_text, re.IGNORECASE)
            if matches:
                answer = f"Found dates: {', '.join(matches)}"
                return answer, []

    # Default response
    return (
        "I couldn't find specific information to answer your question in the document.",
        [],
    )

@app.route("/upload", methods=["POST"])
def upload_file():
    global current_pdf_path, current_pdf_text, current_pdf_pages

    print("\n" + "=" * 60)
    print(" STARTING PDF UPLOAD PROCESS")
    print("=" * 60)

    if "pdf" not in request.files:
        print("❌ ERROR: No file provided in request")
        return jsonify({"error": "No file provided"}), 400

    file = request.files["pdf"]
    if file.filename == "":
        print("❌ ERROR: No file selected")
        return jsonify({"error": "No file selected"}), 400

    # Check file size before processing
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset to beginning
    print(f"   File size: {file_size / (1024 * 1024):.1f}MB")

    if file_size > app.config["MAX_CONTENT_LENGTH"]:
        print(
            f"❌ ERROR: File too large ({file_size / (1024 * 1024):.1f}MB > {app.config['MAX_CONTENT_LENGTH'] // (1024 * 1024)}MB)"
        )
        return jsonify(
            {
                "error": f"File too large. Maximum size is {app.config['MAX_CONTENT_LENGTH'] // (1024 * 1024)}MB"
            }
        ), 413

    if file and file.filename.lower().endswith(".pdf"):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)

        try:
            # Save file
            file.save(filepath)
            print(f"   Saved to: {filepath}")
            print(f"   Processing PDF: {filename} ({file_size / (1024 * 1024):.1f}MB)")

            # Extract text and structure from PDF with error handling
            try:
                current_pdf_pages = extract_text_from_pdf(filepath)

                if not current_pdf_pages:
                    print("❌ ERROR: No pages could be extracted from PDF")
                    raise Exception("No pages could be extracted from PDF")

                current_pdf_path = filepath
                current_pdf_text = " ".join(
                    [page["text"] for page in current_pdf_pages]
                )

                # print(f"   Extracted text from {len(current_pdf_pages)} pages")
                # print(f"   Total text length: {len(current_pdf_text)} characters")

            except Exception as pdf_error:
                print(f"❌ ERROR in PDF text extraction: {str(pdf_error)}")
                # Clean up file on PDF processing error
                if os.path.exists(filepath):
                    os.remove(filepath)
                    print("🗑️ Cleaned up temporary file due to extraction error")
                raise Exception(f"PDF processing failed: {str(pdf_error)}")

            # Detect document domain for optimal embedding model selection
            text_sample = current_pdf_text[:2000] if current_pdf_text else ""
            document_domain = detect_document_domain(text_sample)
            print(f"   Detected document domain: {document_domain}")

            # Initialize embedding system with domain-specific model (optional, don't fail if it doesn't work)
            embeddings_created = False
            try:
                if not embedding_model:
                    initialize_embedding_system(document_domain)

                # Create embeddings for the document
                if embedding_model:
                    embeddings_created = create_embeddings_for_document(
                        current_pdf_pages
                    )

            except Exception as embedding_error:
                print(f"⚠️ WARNING: Embedding creation failed: {str(embedding_error)}")
                print("   Continuing without embeddings (basic search will still work)")
                # Don't fail the upload if embeddings fail

            print(f"   Pages processed: {len(current_pdf_pages)}")
            print(f"   Embeddings created: {embeddings_created}")
            print(f"   Document domain: {document_domain}")
            print(f"   File size: {round(file_size / (1024 * 1024), 1)}MB")

            return jsonify(
                {
                    "message": "File uploaded successfully",
                    "pages": len(current_pdf_pages),
                    "embeddings_created": embeddings_created,
                    "document_domain": document_domain,
                    "file_size_mb": round(file_size / (1024 * 1024), 1),
                }
            )

        except Exception as e:
            print(f"❌ CRITICAL ERROR in upload process: {str(e)}")
            # Clean up file on any error
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                    print("🗑️ Cleaned up temporary file due to critical error")
                except:
                    print("⚠️ Failed to clean up temporary file")

            error_msg = str(e)
            print(f"Upload error: {error_msg}")
            print("=" * 60 + "\n")

            # Return more specific error messages
            if "memory" in error_msg.lower() or "out of memory" in error_msg.lower():
                return jsonify(
                    {
                        "error": "PDF too complex for processing. Try a smaller or simpler PDF."
                    }
                ), 507
            elif "timeout" in error_msg.lower():
                return jsonify(
                    {"error": "PDF processing timed out. Try a smaller PDF."}
                ), 408
            else:
                return jsonify({"error": f"Error processing PDF: {error_msg}"}), 500

    print("❌ ERROR: Invalid file type (not a PDF)")
    print("=" * 60 + "\n")
    return jsonify({"error": "Invalid file type. Please upload a PDF file."}), 400

@app.route("/upload", methods=["OPTIONS"])
def upload_options():
    return ("", 204)

@app.route("/ask", methods=["POST"])
def ask_question():
    global current_pdf_pages, embedding_model

    if not current_pdf_pages:
        return jsonify({"error": "No PDF uploaded"}), 400

    data = request.get_json()
    question = data.get("question", "")

    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        context_text = None
        page_sources = []

        # Use embedding-based Q&A if available, otherwise fallback to simple
        if embedding_model and collection:
            # Get semantic search results to capture context
            relevant_chunks = semantic_search(question, top_k=3)

            if relevant_chunks:
                # Build context and page sources
                context_parts = []
                page_sources = []
                for chunk in relevant_chunks:
                    page_num = chunk["page"]
                    page_text = chunk["text"]
                    context_parts.append(
                        f"=== PAGE {page_num} ===\n{page_text}\n=== END PAGE {page_num} ==="
                    )
                    page_sources.append(page_num)

                context_text = "\n\n".join(context_parts)

            answer, _ = answer_question_with_embeddings(question, current_pdf_pages, context_text, page_sources)
        else:
            answer, _ = answer_question_simple(question, current_pdf_pages)

        # Extract page citations from answer
        cited_pages = []
        if answer:
            # Look for citation patterns like "(Source: Page 5)" or "(Source: Pages 1, 3, 5)"
            citation_patterns = [
                r"\(Source:\s*Pages?\s*([\d,\s-]+)\)",
            ]

            for pattern in citation_patterns:
                matches = re.findall(pattern, answer, re.IGNORECASE)
                for match in matches:
                    # Handle different formats: "1, 2, 3" or "1-3" or "1, 3-5"
                    page_parts = match.split(",") if "," in match else [match]
                    for part in page_parts:
                        part = part.strip()
                        if "-" in part:
                            # Handle ranges like "1-3"
                            try:
                                start, end = part.split("-")
                                start, end = int(start.strip()), int(end.strip())
                                cited_pages.extend(range(start, end + 1))
                            except ValueError:
                                continue
                        else:
                            # Handle single page numbers
                            try:
                                cited_pages.append(int(part))
                            except ValueError:
                                continue

        # If no cited pages found from answer, use pages from semantic search
        if not cited_pages and page_sources:
            cited_pages = page_sources

        # Remove duplicates and sort
        cited_pages = sorted(list(set(cited_pages)))

        return jsonify(
            {
                "answer": answer,
                "cited_pages": cited_pages,
                "method": "embeddings" if embedding_model else "simple",
                "context": context_text,
                "pages_used": page_sources,
            }
        )
    except Exception as e:
        return jsonify({"error": f"Error processing question: {str(e)}"}), 500

@app.route("/extracted-text", methods=["GET"])
def get_extracted_text():
    """Return the extracted text from the current PDF"""
    global current_pdf_pages

    if not current_pdf_pages:
        return jsonify({"error": "No PDF uploaded"}), 400

    # Format the extracted text for display
    extracted_data = []

    for page_data in current_pdf_pages:
        page_info = {
            "page_number": page_data["page_num"],
            "text": page_data["text"],
            "text_blocks": [],
            "total_blocks": len(page_data["text_blocks"]),
        }

        # Add detailed text block information
        for i, block in enumerate(page_data["text_blocks"]):
            block_info = {
                "block_id": i + 1,
                "text": block["text"],
                "coordinates": {
                    "x": round(block["bbox"][0], 2),
                    "y": round(block["bbox"][1], 2),
                    "width": round(block["bbox"][2] - block["bbox"][0], 2),
                    "height": round(block["bbox"][3] - block["bbox"][1], 2),
                },
                "extraction_method": block.get("extraction_method", "unknown"),
            }

            # Add page dimensions if available
            if "page_width" in block:
                block_info["page_dimensions"] = {
                    "width": block["page_width"],
                    "height": block["page_height"],
                }

            page_info["text_blocks"].append(block_info)

        extracted_data.append(page_info)

    return jsonify(
        {
            "total_pages": len(current_pdf_pages),
            "total_text_length": len(current_pdf_text) if current_pdf_text else 0,
            "extraction_method": "PyMuPDF with OCR fallback",
            "pages": extracted_data,
        }
    )

@app.route("/api/models/config", methods=["GET"])
def get_model_config():
    """Get current model configuration"""
    try:
        return jsonify(
            {
                "llm": model_config.get_llm_config(),
                "embedding": model_config.get_embedding_config(),
                "available_models": AVAILABLE_MODELS,
            }
        )
    except Exception as e:
        print(f"Error getting model config: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/models/config", methods=["POST"])
def update_model_config():
    """Update model configuration"""
    try:
        data = request.get_json()

        if "llm" in data:
            model_config.update_llm_config(data["llm"])
            print(f"Updated LLM config: {data['llm']}")

        if "embedding" in data:
            model_config.update_embedding_config(data["embedding"])
            print(f"Updated embedding config: {data['embedding']}")

            # Reinitialize embedding system if embedding config changed
            global embedding_model, chroma_client, collection
            embedding_model = None
            chroma_client = None
            collection = None

            # Reinitialize with new config
            initialize_embedding_system()

        return jsonify(
            {
                "message": "Model configuration updated successfully",
                "llm": model_config.get_llm_config(),
                "embedding": model_config.get_embedding_config(),
            }
        )
    except Exception as e:
        print(f"Error updating model config: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify(
        {"status": "healthy", "timestamp": time.time(), "message": "we are alivve!"}
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    debug = os.environ.get("FLASK_ENV") != "production"
    app.run(debug=debug, host="0.0.0.0", port=port)