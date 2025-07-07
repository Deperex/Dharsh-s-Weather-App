# Dharsh Nagrani's Full-Stack Weather App

A comprehensive weather application with historical data persistence, built with a Python Flask backend and a React frontend.

## Features

- **Current and Historical Forecast**: Enter a location and date range to fetch and store weather data.
- **CRUD Operations**: Create, read, update, and delete historical weather records in an SQLite database.

- **Info Modal**: Learn about Product Manager Accelerator via an in-app modal.

## Tech Stack

- **Backend**: Python, Flask, Flask-CORS, Flask-SQLAlchemy, python-dotenv, requests
- **Database**: SQLite (`weather.db`)
- **Frontend**: React, Axios, CSS

## Backend Setup

1. **Navigate to the backend folder**
   cd weather_backend
2. **Create and activate a virtual environement**
   python -m venv venv
   source venv/bin/activate
3. **Install dependencies**
   pip install -r requirements.txt

## Frontend Setup
1. **Navigate to the frontend folder**
   cd weather-frontend
2. **Install Dependencies**
   npm install
3. **Add to package-json**
   Under "name" line add "proxy" : "http://127.0.0.1:5000"
4. **Start the server | Once again run in weather-frontend directory**
   npm start

## Author 
Dharsh Nagrani
   
   
