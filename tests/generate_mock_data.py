import pandas as pd
import numpy as np

def generate_data(num_records=1500, output_path="sample_data.csv"):
    np.random.seed(42)
    
    # 1. Base Identifiers
    user_ids = [f"user_{i}" for i in range(1, num_records + 1)]
    days_since_signup = np.random.randint(1, 1000, num_records)
    
    # 2. Activity / Core Engagement
    days_since_last_activity = np.random.randint(0, 100, num_records)
    logins_last_30_days = np.random.poisson(lam=10, size=num_records)
    total_active_hours = days_since_signup * np.random.uniform(0.1, 2.0, num_records)
    
    # 3. Financial & Value
    lifetime_value_dollars = days_since_signup * np.random.uniform(5, 50, num_records)
    payments_made = np.floor(days_since_signup / 30).astype(int) + np.random.poisson(lam=1, size=num_records)
    
    # Correlations for price sensitivity (Discount bucket)
    payment_failures_count = np.random.poisson(lam=0.5, size=num_records)
    pricing_page_visits = np.random.poisson(lam=1, size=num_records)
    
    # 4. Support & Frustration (Outreach Call bucket)
    support_tickets = np.random.poisson(lam=2, size=num_records)
    open_complaint_tickets = np.random.poisson(lam=0.3, size=num_records)
    sentiment_score = np.random.uniform(1.0, 5.0, num_records) # 1=Angry, 5=Happy
    failed_onboarding_steps = np.random.randint(0, 5, num_records)
    
    # 5. Product Usage (Feature Nudge bucket)
    plan_utilization_percent = np.random.uniform(0, 100, num_records)
    core_features_untouched = np.random.randint(0, 10, num_records)
    
    primary_use_cases = ['E-commerce', 'B2B', 'Agency', 'Personal']
    primary_use_case = np.random.choice(primary_use_cases, size=num_records)

    # Inject Churn Correlations (Modify data to make Churn obvious to the model)
    # Let's say ~30% are highly at risk of churn
    at_risk_idx = np.random.choice(num_records, size=int(num_records * 0.3), replace=False)
    
    for i in at_risk_idx:
        scenario = np.random.randint(0, 3)
        days_since_last_activity[i] = np.random.randint(25, 100) # Inactive
        logins_last_30_days[i] = np.random.randint(0, 3)
        
        if scenario == 0:
            # Frustrated
            open_complaint_tickets[i] += np.random.randint(1, 4)
            sentiment_score[i] = np.random.uniform(1.0, 2.5)
            support_tickets[i] += np.random.randint(3, 8)
        elif scenario == 1:
            # Price Sensitive
            payment_failures_count[i] += np.random.randint(1, 3)
            pricing_page_visits[i] += np.random.randint(5, 15)
        else:
            # Not getting value
            plan_utilization_percent[i] = np.random.uniform(0, 20)
            core_features_untouched[i] += np.random.randint(5, 10)

    df = pd.DataFrame({
        "user_id": user_ids,
        "days_since_signup": days_since_signup,
        "days_since_last_activity": days_since_last_activity,
        "logins_last_30_days": logins_last_30_days,
        "total_active_hours": total_active_hours,
        "payments_made": payments_made,
        "lifetime_value_dollars": lifetime_value_dollars,
        "payment_failures_count": payment_failures_count,
        "pricing_page_visits": pricing_page_visits,
        "support_tickets": support_tickets,
        "open_complaint_tickets": open_complaint_tickets,
        "sentiment_score": sentiment_score,
        "failed_onboarding_steps": failed_onboarding_steps,
        "plan_utilization_percent": plan_utilization_percent,
        "core_features_untouched": core_features_untouched,
        "primary_use_case": primary_use_case
    })
    
    df.to_csv(output_path, index=False)
    print(f"Generated {num_records} highly correlated records with 15 features to {output_path}")

if __name__ == "__main__":
    generate_data()
