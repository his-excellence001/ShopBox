import numpy as np

def calculate_best_purchase_window(p_current, p_history_30_days, d_sales, c_flow, lead_time, current_stock):
    """
    Determines if it's the optimal time to buy stock based on market trends and cash flow.
    """
    # 1. Calculate historical 30-day average and volatility (standard deviation)
    p_avg = np.mean(p_history_30_days)
    sigma = np.std(p_history_30_days)
    
    alerts = []
    recommended_order = 0
    
    # 2. Check for immediate discount opportunities
    price_discount_score = (p_avg - p_current) / p_avg
    
    if price_discount_score > 0.12:  # 12% below average
        alerts.append(f"Supplier discount detected! Price is {price_discount_score*100:.1f}% below average.")
        
        # Calculate optimal order quantity while honoring cash limits
        safety_stock_multiplier = 1.5
        needed_stock = current_stock + (d_sales * lead_time * safety_stock_multiplier)
        
        # Ensure we don't recommend spending more cash than available
        cash_flow_limit = c_flow / p_current 
        recommended_order = min(needed_stock, cash_flow_limit)
        
    # 3. Predict future price trends (Linear Regression simulation)
    # In a full setup, use a linear regression fit over the historical points
    x = np.arange(len(p_history_30_days))
    slope, intercept = np.polyfit(x, p_history_30_days, 1)
    predicted_price_week_2 = intercept + slope * (len(p_history_30_days) + 14)
    
    if predicted_price_week_2 > (p_current * 1.08):
        alerts.append("Market indicator: Prices are trending upward. Recommend stocking up early.")
        
    return {
        "trigger_alerts": alerts,
        "recommended_order_qty": recommended_order
    }