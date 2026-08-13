import pandas as pd
import numpy as np
import random
import os

def generate_dataset(filename, num_rows, profile):
    np.random.seed()
    random.seed()
    
    # Base configuration based on profile
    if profile == 'startup':
        # High churn, low engagement, new users
        days_signup_mean, days_signup_std = 90, 30
        sentiment_mean, sentiment_std = 0.4, 0.2
        utilization_mean, utilization_std = 30, 15
        support_rate = 0.7
    elif profile == 'enterprise':
        # Low churn, high engagement, veteran users
        days_signup_mean, days_signup_std = 700, 200
        sentiment_mean, sentiment_std = 0.8, 0.1
        utilization_mean, utilization_std = 80, 15
        support_rate = 0.2
    elif profile == 'midmarket':
        # Balanced
        days_signup_mean, days_signup_std = 365, 100
        sentiment_mean, sentiment_std = 0.6, 0.2
        utilization_mean, utilization_std = 55, 25
        support_rate = 0.4
    elif profile == 'growth':
        # High growth, engaged users, few issues
        days_signup_mean, days_signup_std = 180, 60
        sentiment_mean, sentiment_std = 0.75, 0.15
        utilization_mean, utilization_std = 70, 20
        support_rate = 0.3
    else: # legacy
        # Old users, unhappy, complex
        days_signup_mean, days_signup_std = 1000, 300
        sentiment_mean, sentiment_std = 0.3, 0.2
        utilization_mean, utilization_std = 40, 30
        support_rate = 0.8

    data = []
    use_cases = ['E-commerce', 'SaaS', 'Marketing', 'Finance', 'Education']
    
    for i in range(1, num_rows + 1):
        # Tenure
        days_since_signup = max(1, int(np.random.normal(days_signup_mean, days_signup_std)))
        
        # Activity
        # Unhappy profiles tend to have less activity recently
        if random.random() < support_rate:
            days_since_last_activity = np.random.randint(15, 60)
            logins = np.random.randint(0, 5)
        else:
            days_since_last_activity = np.random.randint(0, 14)
            logins = np.random.randint(5, 30)
            
        total_active_hours = logins * np.random.uniform(0.5, 3.0)
        
        # Financials
        months = max(1, days_since_signup // 30)
        payments_made = int(months * np.random.uniform(0.5, 1.0))
        lifetime_value_dollars = payments_made * np.random.uniform(50, 500)
        
        payment_failures = np.random.poisson(0.5) if random.random() < support_rate else 0
        pricing_page_visits = np.random.poisson(2) if random.random() < support_rate else np.random.poisson(0.1)
        
        # Support
        support_tickets = np.random.poisson(3) if random.random() < support_rate else np.random.poisson(0.5)
        open_complaints = np.random.poisson(1) if support_tickets > 2 else 0
        
        # Sentiments & Usage
        sentiment = min(1.0, max(0.0, np.random.normal(sentiment_mean, sentiment_std)))
        
        onboarding = np.random.poisson(1) if days_since_signup < 60 else 0
        utilization = min(100, max(0, int(np.random.normal(utilization_mean, utilization_std))))
        untouched = max(0, int((100 - utilization) / 10))
        
        uc = random.choice(use_cases)
        
        data.append({
            'user_id': f"user_{profile}_{i}",
            'days_since_signup': days_since_signup,
            'days_since_last_activity': days_since_last_activity,
            'logins_last_30_days': logins,
            'total_active_hours': round(total_active_hours, 1),
            'payments_made': payments_made,
            'lifetime_value_dollars': round(lifetime_value_dollars, 2),
            'payment_failures_count': payment_failures,
            'pricing_page_visits': pricing_page_visits,
            'support_tickets': support_tickets,
            'open_complaint_tickets': open_complaints,
            'sentiment_score': round(sentiment, 2),
            'failed_onboarding_steps': onboarding,
            'plan_utilization_percent': utilization,
            'core_features_untouched': untouched,
            'primary_use_case': uc
        })
        
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False)
    print(f"Generated {filename} with {num_rows} rows.")

if __name__ == "__main__":
    datasets = [
        ('dataset_1_startup.csv', 800, 'startup'),
        ('dataset_2_enterprise.csv', 3500, 'enterprise'),
        ('dataset_3_midmarket.csv', 1500, 'midmarket'),
        ('dataset_4_growth.csv', 2200, 'growth'),
        ('dataset_5_legacy.csv', 4500, 'legacy')
    ]
    
    for filename, size, profile in datasets:
        generate_dataset(filename, size, profile)
    
    print("Successfully generated 5 distinct datasets.")
