import json

def generate_report(ranked_results, metrics, df, reliability_notes):
    """
    Generates a structured JSON report.
    """
    
    # Calculate overall churn risk based on probability > 0.5
    at_risk_users = ranked_results[ranked_results['churn_probability'] > 0.5]
    total_count = len(ranked_results)
    at_risk_count = len(at_risk_users)
    churn_percentage = (at_risk_count / total_count) * 100 if total_count > 0 else 0
    
    # Calculate action breakdown
    action_counts = at_risk_users['recommended_action'].value_counts().to_dict()
    
    # Extract top 10 highest risk users
    top_10 = ranked_results.head(10)[['user_id', 'churn_probability', 'top_reason', 'recommended_action', 'days_since_signup']].to_dict(orient='records')
    
    # Basic static insights - could be made dynamic based on correlations
    insights = [
        "Users inactive for more than 30 days are most likely to churn.",
        "Low login frequency in the last 30 days is strongly correlated with churn.",
        "Business Assumption: Churn is defined strictly as 30 days of inactivity. This may vary per business model."
    ]
    
    # Compile the reliability note
    if not reliability_notes:
        reliability_note = "Data size and quality appear sufficient. Predictions should be generally reliable."
    else:
        reliability_note = "WARNING: Predictions may be unreliable due to the following data issues: " + "; ".join(reliability_notes)
        
    report = {
        "total_customers": total_count,
        "at_risk_count": at_risk_count,
        "churn_percentage": round(churn_percentage, 2),
        "action_counts": action_counts,
        "model_performance": {
            "accuracy": round(metrics['accuracy'], 4) if metrics['accuracy'] else None,
            "auc": round(metrics['auc'], 4) if metrics['auc'] else None
        },
        "high_risk_users": top_10,
        "insights": insights,
        "reliability_note": reliability_note
    }
    
    # Save report
    with open('churn_report.json', 'w') as f:
        json.dump(report, f, indent=4)
        
    print("Report generated: churn_report.json")
    return report
