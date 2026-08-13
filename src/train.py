import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, roc_auc_score

def train_and_evaluate(X, y):
    """
    Splits data, trains a Random Forest model, and evaluates performance.
    """
    # Train/Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred_probs = model.predict_proba(X_test)[:, 1]
    y_pred_classes = model.predict(X_test)
    
    if len(np.unique(y_test)) > 1:
        auc_score = roc_auc_score(y_test, y_pred_probs)
    else:
        auc_score = None
        print("Warning: Only one class present in test set, AUC not defined.")
        
    accuracy = accuracy_score(y_test, y_pred_classes)
    
    metrics = {
        "accuracy": accuracy,
        "auc": auc_score
    }
    
    return model, metrics
