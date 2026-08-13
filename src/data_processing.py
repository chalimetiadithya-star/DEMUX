import pandas as pd  # pyrefly: ignore [missing-import]

from sklearn.preprocessing import StandardScaler  # pyrefly: ignore [missing-import]
import warnings

def load_and_validate_data(filepath):
    """Loads CSV and performs basic validation."""
    try:
        df = pd.read_csv(filepath)
    except Exception as e:
        raise ValueError(f"Failed to load CSV: {e}")
    
    reliability_notes = []
    
    if len(df) < 1000:
        msg = f"Warning: Dataset is very small ({len(df)} rows). Deep learning models typically require more data to generalize well."
        print(msg)
        warnings.warn(msg)
        reliability_notes.append(msg)
        
    return df, reliability_notes

def handle_outliers(df, numeric_cols):
    """Clips outliers at the 1st and 99th percentiles."""
    df_clean = df.copy()
    for col in numeric_cols:
        lower_bound = df_clean[col].quantile(0.01)
        upper_bound = df_clean[col].quantile(0.99)
        df_clean[col] = df_clean[col].clip(lower=lower_bound, upper=upper_bound)
    return df_clean

def preprocess_data(df, churn_threshold=30):
    """
    Cleans data, creates labels, and scales features.
    Assumes specific column names exist based on requirements.
    """
    reliability_notes = []
    
    # 1. Deduplication
    initial_len = len(df)
    df = df.drop_duplicates()
    if len(df) < initial_len:
        msg = f"Removed {initial_len - len(df)} duplicate rows."
        reliability_notes.append(msg)
        print(msg)
        
    # Check for required columns
    required_cols = [
        'days_since_signup', 
        'days_since_last_activity', 
        'logins_last_30_days', 
        'total_active_hours',
        'payments_made',
        'lifetime_value_dollars',
        'payment_failures_count',
        'pricing_page_visits',
        'support_tickets',
        'open_complaint_tickets',
        'sentiment_score',
        'failed_onboarding_steps',
        'plan_utilization_percent',
        'core_features_untouched',
        'primary_use_case'
    ]
    
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")
        
    # 2. Labeling
    # Churn = 1 if inactive > threshold
    df['churn'] = (df['days_since_last_activity'] > churn_threshold).astype(int)
    
    # 3. Feature Selection & Encoding
    # Drop user_id and label for feature set
    features = df[required_cols].copy()
    
    # One-hot encode categorical features
    if 'primary_use_case' in features.columns:
        features = pd.get_dummies(features, columns=['primary_use_case'], drop_first=True)
        
    numeric_cols = features.select_dtypes(include=['int64', 'float64']).columns
    
    # 4. Handle Missing Values
    # Instead of dropping, we impute with median for numeric stability (avoids misleading averages)
    missing_counts = features.isnull().sum()
    if missing_counts.sum() > 0:
        msg = "Missing values detected and imputed with medians."
        reliability_notes.append(msg)
        
    for col in numeric_cols:
        if features[col].isnull().any():
            median_val = features[col].median()
            features[col] = features[col].fillna(median_val)
            
    # 5. Handle Outliers
    features = handle_outliers(features, numeric_cols)
    
    # 6. Scaling
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(features)
    
    X = scaled_features
    y = df['churn'].values
    feature_names = features.columns.tolist()
    
    # Check if dataset is highly imbalanced
    churn_rate = y.mean()
    if churn_rate < 0.05 or churn_rate > 0.95:
        msg = f"Warning: Highly skewed label distribution (churn rate: {churn_rate:.2%}). Predictions may be biased."
        reliability_notes.append(msg)
        
    return X, y, df, scaler, feature_names, reliability_notes
