import argparse
import os
import json
from data_processing import load_and_validate_data, preprocess_data
from train import train_and_evaluate
from predict import generate_predictions
from report import generate_report


def run_pipeline(filepath):
    if not os.path.exists(filepath):
        print(f"Error: Dataset not found at {filepath}")
        return None

    print("--- Starting Churn Prediction Pipeline ---")
    
    # 1. Load Data
    print("Loading data...")
    df, load_notes = load_and_validate_data(filepath)
    
    # 2. Preprocess Data
    print("Preprocessing data...")
    X, y, df_clean, scaler, feature_names, process_notes = preprocess_data(df)
    
    # Combine reliability notes
    reliability_notes = load_notes + process_notes
    
    # 3. Train and Evaluate
    model, metrics = train_and_evaluate(X, y)
    
    print(f"Model Performance - Accuracy: {metrics['accuracy']:.4f}, AUC: {metrics['auc']:.4f}")
    
    # 4. Predict and Rank
    ranked_results = generate_predictions(model, X, df_clean, feature_names)
    
    # 6. Generate Report
    report = generate_report(ranked_results, metrics, df_clean, reliability_notes)
    
    print("\n--- Pipeline Complete ---")
    return report

def main():
    parser = argparse.ArgumentParser(description="Churn Prediction Pipeline")
    parser.add_argument("--data", type=str, default="../sample_data.csv", help="Path to input CSV")
    args = parser.parse_args()
    
    report = run_pipeline(args.data)
    if report:
        print(json.dumps(report, indent=4))

if __name__ == "__main__":
    main()
