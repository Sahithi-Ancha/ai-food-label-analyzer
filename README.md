# AI-Powered Food Label Analyzer

## Overview

AI-Powered Food Label Analyzer is a mobile application that helps users make healthier food choices by analyzing packaged food products through ingredient label scanning and barcode detection.

The application extracts ingredient information from food labels using OCR technology, identifies allergens and additives, evaluates nutritional quality, and generates personalized food insights based on user preferences.

---

## Features

### Ingredient Label Analysis

* Capture or upload food label images
* Extract ingredients using OCR
* Detect allergens and additives
* Identify preservatives and artificial ingredients
* Generate ingredient-based health insights

### Barcode Scanning

* Scan product barcodes using the device camera
* Retrieve product information from Open Food Facts
* Display nutritional information
* Show ingredients and allergen details
* Provide product health ratings

### Health Scoring Engine

* Custom food grading system (A–E)
* Nutrition-based scoring
* Additive penalty calculations
* Ingredient quality assessment
* Personalized recommendations

### Personalized Food Warnings

* Allergen alerts
* Ingredient risk notifications
* Dietary preference checks
* Nutrition warnings for high sugar, sodium, and processed foods

---

## Tech Stack

### Frontend

* React Native
* Expo
* Expo Router
* Expo Camera
* TypeScript

### Backend

* FastAPI
* Python

### APIs & Data Sources

* Open Food Facts API
* OCR Processing
* Food Additives Dataset
* Nutrition Analysis Engine

---

## System Architecture

User → Mobile App → OCR / Barcode Scanner → FastAPI Backend → Food Analysis Engine → Results Dashboard

---

## Key Functionalities

### OCR Workflow

1. User captures or uploads a food label image
2. OCR extracts ingredient information
3. Backend processes ingredients
4. Allergens and additives are identified
5. Health score is calculated
6. Results are displayed to the user

### Barcode Workflow

1. User scans a barcode
2. Product information is fetched from Open Food Facts
3. Nutrition and ingredient data are analyzed
4. Health insights and warnings are generated
5. Results are displayed to the user

---

## Project Highlights

* Built an end-to-end mobile application for food product analysis
* Implemented OCR-based ingredient extraction workflow
* Integrated external food databases through APIs
* Developed a custom health scoring model
* Created personalized dietary warning mechanisms
* Designed a scalable frontend and backend architecture

---

## Future Enhancements

* AI-powered ingredient risk prediction
* Personalized nutrition recommendations
* Product comparison engine
* Meal planning integration
* Health profile customization
* Machine learning-based food scoring

---

## Installation

### Frontend

```bash
npm install
npx expo start
```

### Backend

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

---
