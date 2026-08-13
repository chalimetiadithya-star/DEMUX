from flask import Flask, request, jsonify, render_template
import os
import sys

# Ensure src is in path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))
from pipeline import run_pipeline

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create uploads folder if not exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    # Clear previous session data when returning to home
    if os.path.exists('churn_report.json'):
        try:
            os.remove('churn_report.json')
        except:
            pass
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html', active_page='dashboard')

@app.route('/customers')
def customers():
    return render_template('customers.html', active_page='customers')

@app.route('/api/data', methods=['GET'])
def get_data():
    report_path = 'churn_report.json'
    if os.path.exists(report_path):
        import json
        with open(report_path, 'r') as f:
            data = json.load(f)
        return jsonify(data), 200
    else:
        return jsonify({'error': 'No data available. Please upload a CSV first.'}), 404

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    if file and file.filename.endswith('.csv'):
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        
        try:
            # Run the deep learning pipeline on the uploaded file
            report = run_pipeline(filepath)
            if report is None:
                return jsonify({'error': 'Pipeline failed to process the dataset'}), 500
            
            return jsonify(report), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'Invalid file type. Please upload a CSV.'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
