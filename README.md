# StockSense


One-line project description.

An AI-powered inventory intelligence system that predicts SKU-level demand, optimizes restocking decisions, and prevents overstocking and stockouts using time-series forecasting.

# 1. Problem Statement
Problem Title

Inventory Demand Forecasting Tool

# Problem Description

Retailers and e-commerce businesses struggle to maintain optimal inventory levels due to unpredictable demand patterns, seasonality, trends, and external factors. Poor forecasting leads to:

Overstocking (capital blockage)

Stockouts (lost sales & customer dissatisfaction)

Inefficient supply chain planning

Manual or rule-based forecasting systems fail to capture complex demand patterns at the SKU level.

# Target Users

Retail Store Owners

E-commerce Businesses

Warehouse Managers

Supply Chain Analysts

FMCG Companies

# Existing Gaps

Static rule-based forecasting

No SKU-level intelligence

Lack of seasonality modeling

No confidence intervals

Poor real-time decision support

Limited data-driven restocking alerts

# 2. Problem Understanding & Approach
Root Cause Analysis

Demand is non-linear and seasonal

SKU-level patterns differ significantly

External trends affect sales unpredictably

Manual forecasting ignores historical signals

No predictive automation in small/mid businesses

Solution Strategy

Use historical sales data

Apply time-series forecasting models

Capture trend + seasonality + noise

Generate demand prediction + confidence interval

Provide smart restocking recommendations

# 3. Proposed Solution
Solution Overview

StockSense is a full-stack AI-powered system that predicts future SKU demand and suggests optimized restocking quantities.

Core Idea

Use machine learning-based time-series forecasting to:

Predict future sales per SKU

Identify trends & seasonality

Estimate uncertainty range

Recommend restock quantity

Key Features

SKU-wise demand forecasting

Seasonal decomposition

Confidence interval prediction

Low-stock alert system

Smart restocking recommendation

Dashboard with visualization

API-based model access

Real-time forecast generation

# 4. System Architecture
High-Level Flow

User → Frontend → Backend → Model → Database → Response

Architecture Description

User interacts with dashboard (Frontend).

Request is sent to Backend API.

Backend fetches historical data from Database.

ML Model processes data & generates forecast.

Forecast + recommendations returned to Backend.

Backend sends structured response to Frontend.

Dashboard displays insights & alerts.

Architecture Diagram

(Add system architecture diagram image here)

# 5. Database Design
ER Diagram

(Add ER diagram image here)

ER Diagram Description

Entities:

User

user_id (PK)

name

email

role

Product (SKU)

sku_id (PK)

product_name

category

price

Sales

sale_id (PK)

sku_id (FK)

date

quantity_sold

Inventory

inventory_id (PK)

sku_id (FK)

current_stock

reorder_level

Relationships:

One SKU → Many Sales records

One SKU → One Inventory record

# 6. Dataset Selected
Dataset Name

Retail Sales Forecasting Dataset

Source

Kaggle

Data Type

Time-series sales data including:

Date

SKU/Product ID

Units Sold

Store Information

Category

Selection Reason

Real-world retail scenario

Time-series structure

Multiple SKUs

Suitable for forecasting models

Preprocessing Steps

Handling missing values

Date formatting

Feature engineering (day, month, season)

Aggregation at SKU level

Train-test split (time-based)

Normalization (if required)

# 7. Model Selected
Model Name

Facebook Prophet (Primary Model)

Selection Reasoning

Handles seasonality well

Robust to missing data

Captures trend + seasonality automatically

Easy interpretability

Fast to train

Alternatives Considered

ARIMA

SARIMA

LSTM

XGBoost Regression

Evaluation Metrics

MAE (Mean Absolute Error)

RMSE (Root Mean Square Error)

MAPE (Mean Absolute Percentage Error)

R² Score

# 8. Technology Stack
Frontend

React.js

Tailwind CSS

Chart.js / Recharts

Backend

FastAPI

Python

ML/AI

Prophet

Scikit-learn

Pandas

NumPy

Database

PostgreSQL

Deployment

Docker

Render / AWS / Railway

# 9. API Documentation & Testing
API Endpoints List
Endpoint 1:

GET /forecast/{sku_id}
Returns future demand forecast

Endpoint 2:

GET /inventory-alert/{sku_id}
Returns stock risk status

Endpoint 3:

POST /predict
Accepts SKU + date range & returns forecast

API Testing Screenshots

(Add Postman / Thunder Client screenshots here)

# 10. Module-wise Development & Deliverables
Checkpoint 1: Research & Planning

Deliverables:

Problem analysis

Dataset selection

Model research

System design draft

Checkpoint 2: Backend Development

Deliverables:

API endpoints

Database schema

Model loading logic

Checkpoint 3: Frontend Development

Deliverables:

Dashboard UI

SKU selection panel

Forecast visualization

Checkpoint 4: Model Training

Deliverables:

Clean dataset

Trained Prophet model

Evaluation report

Checkpoint 5: Model Integration

Deliverables:

API + Model connection

Real-time prediction endpoint

Error handling

Checkpoint 6: Deployment

Deliverables:

Live backend

Live frontend

Production database

Dockerized setup

# 11. End-to-End Workflow

User selects SKU

Backend fetches historical data

Model generates 30-day forecast

Confidence interval calculated

Restock recommendation generated

Dashboard displays forecast + alerts

# 12. Demo & Video

Live Demo Link:
(Add deployed link here)

Demo Video Link:
(Add video link here)

GitHub Repository:
(Add GitHub repo link here)

# 13. Hackathon Deliverables Summary

Complete full-stack application

SKU-level forecasting model

REST APIs

Dashboard with visualization

Inventory alert system

Deployment-ready architecture

# 14. Team Roles & Responsibilities
Member Name	Role	Responsibilities
Abhinav Sharma	ML & Backend Lead	Model training, API development, database design
Member 2	Frontend Developer	UI design, dashboard, visualization
Member 3	DevOps	Deployment, Docker, cloud setup

# 15. Future Scope & Scalability
Short-Term

Multi-store support

Automated reorder system

Email/SMS alerts

Long-Term

Deep learning forecasting (LSTM/Transformer)

Integration with ERP systems

Real-time streaming data

AI-driven supply chain optimization

# 16. Known Limitations

Depends on historical data quality

Sudden market shocks may reduce accuracy

Limited external feature integration

Prophet assumptions may not fit all SKUs

# 17. Impact

Reduces stockouts

Minimizes overstock

Improves cash flow

Enhances supply chain efficiency

Data-driven decision making for SMEs
