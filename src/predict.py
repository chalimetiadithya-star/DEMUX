import pandas as pd

def generate_predictions(model, X, df, feature_names):
    """
    Predicts churn probabilities and determines reason/action for each user.
    """
    print("Generating predictions...")
    
    probabilities = model.predict_proba(X)[:, 1]
        
    results = df.copy()
    results['churn_probability'] = probabilities
    
    # Calculate recommended actions based on raw features for simplicity (since we dropped SHAP for hackathon speed)
    reasons = []
    actions = []
    
    for idx, row in results.iterrows():
        if row['support_tickets'] > 2 or row['open_complaint_tickets'] > 0 or row['sentiment_score'] < 2.5:
            reasons.append("Frustrated/Support Issues")
            actions.append("Outreach Call")
        elif row['payment_failures_count'] > 0 or row['pricing_page_visits'] > 3:
            reasons.append("Price Sensitive/Billing")
            actions.append("Discount")
        else:
            reasons.append("Low Engagement")
            actions.append("Feature Nudge")
            
    results['top_reason'] = reasons
    results['recommended_action'] = actions
    
    # Rank by highest risk
    ranked_results = results.sort_values(by='churn_probability', ascending=False)
    return ranked_results
