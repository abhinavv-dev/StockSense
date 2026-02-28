# 📦 StockSense  

## 🚀 One-Line Project Description  
**StockSense** is an AI-powered inventory intelligence system that predicts SKU-level demand, optimizes restocking decisions, and prevents overstocking and stockouts using advanced time-series forecasting.

---

# 1️⃣ Project Overview  

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

# 2️⃣ Target Users  

- Retail Store Owners  
- E-commerce Businesses  
- Warehouse Managers  
- Supply Chain Analysts  
- FMCG Companies  

---

# 3️⃣ Existing Gaps in Current Systems  

- Static rule-based forecasting  
- No SKU-level intelligence  
- Lack of seasonality modeling  
- No confidence interval estimation  
- Poor real-time decision support  
- Limited data-driven restocking alerts  

---

# 4️⃣ Problem Understanding & Approach  

## 4.1 Root Cause Analysis  

- Demand is non-linear and seasonal  
- SKU-level patterns differ significantly  
- External trends influence purchasing behavior  
- Manual forecasting ignores historical signals  
- Limited predictive automation for SMEs  

## 4.2 Solution Strategy  

StockSense addresses these challenges by:

- Leveraging historical sales data  
- Applying time-series forecasting models  
- Capturing trend + seasonality + noise  
- Generating demand predictions with confidence intervals  
- Providing smart restocking recommendations  

---

# 5️⃣ Proposed Solution  

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
- Confidence interval prediction  
- Low-stock alert system  
- Smart restocking recommendations  
- Interactive dashboard with visualization  
- API-based model access  
- Real-time forecast generation  

---

# 6️⃣ System Architecture  

## 6.1 High-Level Workflow  

User → Frontend → Backend → ML Model → Database → Response → Dashboard  

## 6.2 Architecture Description  

1. User interacts with dashboard (Frontend).  
2. Request is sent to Backend API.  
3. Backend retrieves historical data from Database.  
4. ML Model processes data and generates forecast.  
5. Forecast and recommendations are returned to Backend.  
6. Backend sends structured response to Frontend.  
7. Dashboard displays insights and alerts.  

## 6.3 Architecture Diagram  

(Add system architecture diagram image here)  

---

# 7️⃣ Database Design  

## 7.1 ER Diagram  

(Add ER diagram image here)  

## 7.2 Entities  

### User  
- `user_id` (PK)  
- `name`  
- `email`  
- `role`  

### Product (SKU)  
- `sku_id` (PK)  
- `product_name`  
- `category`  
- `price`  

### Sales  
- `sale_id` (PK)  
- `sku_id` (FK)  
- `date`  
- `quantity_sold`  

### Inventory  
- `inventory_id` (PK)  
- `sku_id` (FK)  
- `current_stock`  
- `reorder_level`  

## 7.3 Relationships  

- One SKU → Many Sales records  
- One SKU → One Inventory record  

---

# 8️⃣ Dataset  

## 8.1 Dataset Name  
Retail Sales Forecasting Dataset  

## 8.2 Source  
Kaggle  

## 8.3 Data Type  

Time-series sales data including:  

- Date  
- SKU/Product ID  
- Units Sold  
- Store Information  
- Category  

## 8.4 Selection Justification  

- Real-world retail scenario  
- Structured time-series format  
- Multiple SKUs  
- Suitable for forecasting models  

## 8.5 Preprocessing Steps  

- Handling missing values  
- Date formatting  
- Feature engineering (day, month, season)  
- Aggregation at SKU level  
- Time-based train-test split  
- Normalization (if required)  

---

# 9️⃣ Model Selection  

## 9.1 Primary Model  
Facebook Prophet  

## 9.2 Selection Rationale  

- Handles seasonality effectively  
- Robust to missing data  
- Automatically captures trend + seasonality  
- Interpretable outputs  
- Fast training time  

## 9.3 Alternative Models Considered  

- ARIMA  
- SARIMA  
- LSTM  
- XGBoost Regression  

## 9.4 Evaluation Metrics  

- MAE (Mean Absolute Error)  
- RMSE (Root Mean Square Error)  
- MAPE (Mean Absolute Percentage Error)  
- R² Score  

---

# 🔟 Technology Stack  

## 10.1 Frontend  

- React.js  
- Tailwind CSS  
- Chart.js / Recharts  

## 10.2 Backend  

- FastAPI  
- Python  

## 10.3 Machine Learning  

- Prophet  
- Scikit-learn  
- Pandas  
- NumPy  

## 10.4 Database  

- PostgreSQL  

## 10.5 Deployment  

- Docker  
- Render / AWS / Railway  

---

# 1️⃣1️⃣ API Documentation  

## Endpoint 1  
GET /forecast/{sku_id}  
Returns future demand forecast  

## Endpoint 2  
GET /inventory-alert/{sku_id}  
Returns stock risk status  

## Endpoint 3  
POST /predict  
Accepts SKU + date range and returns forecast  

(Add Postman / Thunder Client screenshots here)  

---

# 1️⃣2️⃣ Module-wise Development Plan  

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

# 1️⃣3️⃣ End-to-End Workflow  

1. User selects SKU  
2. Backend fetches historical data  
3. Model generates 30-day forecast  
4. Confidence interval calculated  
5. Restock recommendation generated  
6. Dashboard displays forecast and alerts  

---

# 1️⃣4️⃣ Demo & Repository  

- Live Demo: (Add deployed link here)  
- Demo Video: (Add video link here)  
- GitHub Repository: (Add GitHub repo link here)  

---

# 1️⃣5️⃣ Hackathon Deliverables  

- Complete full-stack application  
- SKU-level forecasting model  
- REST APIs  
- Dashboard with visualization  
- Inventory alert system  
- Deployment-ready architecture  

---

# 1️⃣6️⃣ Team Roles & Responsibilities  

| Member Name       | Role                  | Responsibilities |
|-------------------|-----------------------|------------------|
| Abhinav Sharma    | ML & Backend Lead     | Model training, API development, database design |
| Member 2          | Frontend Developer    | UI design, dashboard, visualization |
| Member 3          | DevOps Engineer       | Deployment, Docker, cloud setup |

---

# 1️⃣7️⃣ Future Scope & Scalability  

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

# 1️⃣8️⃣ Known Limitations  

- Dependent on historical data quality  
- Sudden market shocks may reduce accuracy  
- Limited external feature integration  
- Prophet assumptions may not fit all SKUs  

---

# 1️⃣9️⃣ Impact  

- Reduces stockouts  
- Minimizes overstock  
- Improves cash flow  
- Enhances supply chain efficiency  
- Enables data-driven decision-making for SMEs  
