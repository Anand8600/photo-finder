# 📸 Photo Finder (AI Face Search)

AI-powered photo search platform using face recognition (AWS Rekognition + FAISS).

---

## 🚀 Features

* Upload event photos
* AI face indexing
* Face search
* Admin dashboard
* Public event pages

---

## 🧰 Tech Stack

* Frontend: Next.js
* Backend: FastAPI (Python)
* AI: AWS Rekognition + FAISS

---

## 📦 Project Structure

photo-finder/
frontend/
backend/

---

## ⚙️ Setup Instructions

### 1. Clone repo

git clone https://github.com/Anand8600/photo-finder.git
cd photo-finder

---

### 2. Backend Setup

cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

Create `.env` file:
AWS_ACCESS_KEY=your_key
AWS_SECRET_KEY=your_secret
DATABASE_URL=your_db

Run backend:
uvicorn main:app --reload

---

### 3. Frontend Setup

cd ../frontend
npm install
npm run dev

---

## 🌐 Access

Frontend: http://localhost:3000
Backend: http://localhost:8000

---

## ⚠️ Notes

* `.env` is required (not included)
* Do not upload secrets
