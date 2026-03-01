# StockSense  

## 🚀 One-Line Project Description  
**StockSense** is an AI-powered inventory intelligence system that predicts SKU-level demand, optimizes restocking decisions, and prevents overstocking and stockouts using advanced time-series forecasting.

---

# 1) Project Overview  

## 1.1 Problem Title  
**Inventory Demand Forecasting Tool**

## 1.2 Problem Description  

Retailers and e-commerce businesses face significant challenges in maintaining optimal inventory levels due to:

- Unpredictable demand patterns  
- Seasonality and trends  
- External market factors  
- SKU-level demand variation  

Poor forecasting results in:

- **Overstocking** → Capital blockage  
- **Stockouts** → Lost sales & customer dissatisfaction  
- **Inefficient supply chain planning**  

Traditional manual or rule-based forecasting systems fail to capture complex demand dynamics at the SKU level.

---

# 2) Target Users  

- Retail Store Owners  
- E-commerce Businesses  
- Warehouse Managers  
- Supply Chain Analysts  
- FMCG Companies  

---

# 3) Existing Gaps in Current Systems  

- Static rule-based forecasting  
- No SKU-level intelligence  
- Lack of seasonality modeling  
- No confidence interval estimation  
- Poor real-time decision support  
- Limited data-driven restocking alerts  

---

# 4) Problem Understanding & Approach  

## 4.1 Root Cause Analysis  

- Demand is non-linear and seasonal  
- SKU-level patterns differ significantly  
- External trends influence purchasing behavior  
- Manual forecasting ignores historical signals  
- predictive automation for SMEs  

## 4.2 Solution Strategy  

StockSense addresses these challenges by:

- Leveraging historical sales data  
- Applying time-series forecasting models  
- Capturing trend + seasonality + noise  
- Generating demand predictions with confidence intervals  
- Providing smart restocking recommendations  

---

# 5) Proposed Solution  

## 5.1 Solution Overview  

StockSense is a full-stack AI-powered system that predicts future SKU demand and recommends optimized restocking quantities.

## 5.2 Core Capabilities  

- Predict future sales per SKU  
- Identify trends and seasonality  
- Estimate uncertainty ranges  
- Recommend restock quantities  

## 5.3 Key Features  

- SKU-wise demand forecasting  
- Seasonal decomposition  
- Low-stock alert system  
- Smart restocking recommendations  
- Interactive dashboard with visualization  
- Real-time forecast generation  

---

# 6) System Architecture  

## 6.1 High-Level Workflow  

User → Frontend → Backend → ML Model → Database → Response → Dashboard  

## 6.2 Architecture Description  

1. User interacts with dashboard (Frontend).  
2. Backend retrieves historical data from Database.  
3. ML Model processes data and generates forecast.  
4. Forecast and recommendations are returned to Backend.  
5. Backend sends structured response to Frontend.  
6. Dashboard displays insights and alerts.  

## 6.3 Architecture Diagram  

(Add system architecture diagram image here)  

---


# 7) Database Design   

## 7.1 Entities with Sample Records  

### 👤 User  

| user_id (PK) | name              | email                         | role                  |
|--------------|------------------|------------------------------|-----------------------|
| U001         | Abhinav Sharma   | abhinav@stocksense.com      | ML & Backend Lead     |
| U002         | Riya Mehta       | riya@stocksense.com         | Frontend Developer    |
| U003         | Karan Patel      | karan@stocksense.com        | Warehouse Manager     |

---

### 📦 Product (SKU)  

| sku_id (PK) | product_name        | category        | price (₹) |
|-------------|--------------------|----------------|------------|
| SKU101      | Classic White Tee  | Apparel        | 599        |
| SKU102      | Organic Green Tea  | Beverages      | 299        |
| SKU103      | Wireless Mouse     | Electronics    | 899        |

---

### 📊 Sales  

| sale_id (PK) | sku_id (FK) | date       | quantity_sold |
|--------------|------------|------------|---------------|
| S001         | SKU101    | 2026-01-01 | 25            |
| S002         | SKU101    | 2026-01-02 | 30            |
| S003         | SKU102    | 2026-01-01 | 18            |
| S004         | SKU103    | 2026-01-03 | 12            |
| S005         | SKU102    | 2026-01-04 | 22            |

---

### 📦 Inventory  

| inventory_id (PK) | sku_id (FK) | current_stock | reorder_level |
|-------------------|------------|--------------|---------------|
| INV001            | SKU101    | 150          | 50            |
| INV002            | SKU102    | 80           | 30            |
| INV003            | SKU103    | 40           | 20            |

---

## 7.2 Relationships  

- **One SKU → Many Sales Records**  
  Example: SKU101 has multiple sales entries (S001, S002).  

- **One SKU → One Inventory Record**  
  Example: SKU101 corresponds to one inventory entry (INV001).  

- **One User → Can Manage Multiple SKUs (Logical Relationship)**  
  Example: Warehouse Manager (U003) monitors SKU101, SKU102, and SKU103.  

---


# 8) Model Selection  

## 8.1 Primary Model  
Interactive M5 EDA

## 8.2 Source  
Kaggle -> (https://www.kaggle.com/code/headsortails/back-to-predict-the-future-interactive-m5-eda/report)

## 8.3 Selection Rationale  

- Handles seasonality effectively  
- Automatically captures trend + seasonality  
- Interpretable outputs  

## 8.4 Alternative Models Considered  

- ARIMA – A statistical time-series model that predicts future values using past values, differencing, and past forecast errors.
- SARIMA– An extension of ARIMA that explicitly models repeating seasonal patterns in time-series data. 
- XGBoost Regression – A gradient boosting machine learning algorithm that builds multiple decision trees sequentially to minimize prediction error.

## 8.5 Evaluation Metrics  

To evaluate forecasting performance, the following metrics are commonly used:

---

### 1️⃣ MAE (Mean Absolute Error)

**Definition:**  
Measures the average absolute difference between actual and predicted values. Lower MAE indicates better model accuracy. It treats all errors equally.

---

### 2️⃣ RMSE (Root Mean Square Error)

**Definition:**  
Measures the square root of the average of squared differences between actual and predicted values. It penalizes large errors more than MAE and is useful when large forecasting errors are costly.

---

### 3️⃣ MAPE (Mean Absolute Percentage Error)

**Definition:**  
Measures the average percentage difference between actual and predicted values. It expresses forecasting error as a percentage, making it easier to interpret across different scales.

---

These metrics together provide a comprehensive assessment of forecasting performance, including error magnitude, percentage deviation, and variance explanation.
---

# 9) Technology Stack  

## 9.1 Frontend  

- React.js  
- Tailwind CSS  
- Chart.js / Recharts  

## 9.2 Backend  

- FastAPI  
- Python  

## 9.3 Machine Learning  

- Prophet  
- Scikit-learn  
- Pandas  
- NumPy  

## 9.4 Database  

- PostgreSQL  

## 9.5 Deployment  

- netlify  

---

# 10) Module-wise Development Plan  

## Checkpoint 1: Research & Planning  
- Problem analysis  
- Dataset selection  
- Model research  
- System design draft  

## Checkpoint 2: Backend Development  
- API endpoints  
- Database schema  
- Model loading logic  

## Checkpoint 3: Frontend Development  
- Dashboard UI  
- SKU selection panel  
- Forecast visualization  

## Checkpoint 4: Model Training  
- Clean dataset  
- Trained Prophet model  
- Evaluation report  

## Checkpoint 5: Model Integration  
- API + Model connection  
- Real-time prediction endpoint  
- Error handling  

## Checkpoint 6: Deployment  
- Live backend  
- Live frontend  
- Production database  
- Dockerized setup  

---

# 11) End-to-End Workflow  

1. User selects SKU  
2. Backend fetches historical data  
3. Model generates 30-day forecast  
4. Confidence interval calculated  
5. Restock recommendation generated  
6. Dashboard displays forecast and alerts  

---

# 12) Demo & Repository  

- Live Demo: (https://stocksensehack.netlify.app/dashboard.html)
- Demo Video: (https://drive.google.com/file/d/1piWLBuPigHSSxbTCBp0qQ7utyx-l9iz9/view?usp=sharing)
- presentation: (https://drive.google.com/file/d/1IFnf7JwCjVIFTWpq7n9E9GfMQ4i0iP_1/view?usp=sharing)

---

# 13) Hackathon Deliverables  

- Complete full-stack application  
- SKU-level forecasting model  
- REST APIs  
- Dashboard with visualization  
- Inventory alert system  
- Deployment-ready architecture  

---

# 14) Team Roles & Responsibilities  

| Member Name       | Role                  | Responsibilities |
|-------------------|-----------------------|------------------|
| Abhinav Sharma    | ML & Backend Lead     | Model training, API development, database design |
| Member 2          | Frontend Developer    | UI design, dashboard, visualization |
| Member 3          | DevOps Engineer       | Deployment, Docker, cloud setup |

---

# 15) Future Scope & Scalability  

## Short-Term  

- Multi-store support  
- Automated reorder system  
- Email/SMS alerts  

## Long-Term  

- Deep learning forecasting (LSTM/Transformer)  
- ERP system integration  
- Real-time streaming data  
- AI-driven supply chain optimization  

---

# 16) Known Limitations  

- Dependent on historical data quality  
- Sudden market shocks may reduce accuracy  
- Limited external feature integration  
- Prophet assumptions may not fit all SKUs  

---

# 17) Impact  

- Reduces stockouts  
- Minimizes overstock  
- Improves cash flow  
- Enhances supply chain efficiency  
- Enables data-driven decision-making for SMEs  
- Enables data-driven decision-making for SMEs  
