import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# --- Logging Configuration ---
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)

# --- Folder Configuration ---
UPLOAD_FOLDER = 'files'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handles PDF file uploads with logging."""
    logging.info("Received new file upload request.")
    if 'file' not in request.files:
        logging.warning("Upload request failed: 'file' part missing.")
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        logging.warning("Upload request failed: No file selected.")
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.endswith('.pdf'):
        filename = secure_filename(file.filename)
        logging.info(f"Processing file: {filename}")
        try:
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(save_path)
            logging.info(f"Successfully saved file to {save_path}")
            return jsonify({'message': f'File "{filename}" uploaded successfully!'}), 200
        except Exception as e:
            logging.error(f"Error saving file {filename}: {e}")
            return jsonify({'error': 'An internal error occurred while saving the file.'}), 500
    
    logging.warning(f"Upload request failed: Invalid file type for file '{file.filename}'.")
    return jsonify({'error': 'Invalid file type, please upload a PDF'}), 400

if __name__ == '__main__':
    logging.info("Starting Flask server...")
    app.run(debug=True, port=5001)