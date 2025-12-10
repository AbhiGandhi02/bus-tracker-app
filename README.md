# 🚌 Real-Time Campus Bus Tracker

A full-stack MERN application for tracking college buses in real-time with live GPS tracking, dynamic route management, automated scheduling, and role-based access control.

---

## ✨ Features

### 📍 Real-Time Tracking
- **Live GPS Broadcasting** - Drivers share location via browser's Geolocation API
- **Socket.io Integration** - Sub-second updates pushed to all connected clients
- **Dynamic Maps** - Visualizes bus movement on Google Maps with route polylines
- **ETA Calculation** - Real-time arrival predictions based on traffic and distance

### 🛠 Administrative Control
- **Route Management** - Create routes with autocomplete address search (Google Places API)
- **Schedule Planning** - Assign buses and drivers to specific routes (daily/weekly)
- **Fleet Management** - Add, edit, and manage bus details and driver assignments
- **Analytics Dashboard** - View trip history, usage statistics, and performance metrics

### 🔐 Security & Access
- **Role-Based Access Control (RBAC)** - Distinct portals for:
  - **Master Admin** - Full system control
  - **Planner** - Route and schedule management
  - **Operator (Driver)** - Location broadcasting and trip management
  - **User (Student)** - Real-time bus tracking and notifications
- **Firebase Authentication** - Secure, scalable identity management
- **Geofencing Logic** - Automated validation of ride start/end points

### 🔔 Student Features
- **Favorite Routes** - Save frequently used routes for quick access
- **Push Notifications** - Alerts for bus arrival and delays
- **Route Search** - Find buses by destination or route number
- **Offline Support** - View cached route information without internet

---

## 🎥 Demo

### Live Demo
🔗 **[Try the Live Application](https://bus-tracker-app-six.vercel.app/login)**

---

## 🏗 Tech Stack

### Frontend
- **React.js** (v18.x) with TypeScript
- **Tailwind CSS** - Utility-first styling
- **Google Maps JavaScript API** - Map visualization
- **Socket.io Client** - Real-time communication
- **Firebase SDK** - Authentication
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js** (v18+) & **Express.js** - Server framework
- **MongoDB** with **Mongoose** - Database with compound indexing
- **Socket.io Server** - WebSocket management
- **Google Maps APIs** - Directions, Geocoding, and Places
- **Firebase Admin SDK** - Token verification
- **JWT** - Additional token management

### DevOps & Deployment
- **Frontend Hosting** - Vercel
- **Backend Hosting** - Render
- **Database** - MongoDB Atlas
- **Version Control** - Git & GitHub
- **CI/CD** - GitHub Actions

---

## 🏛 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Admin     │  │    Driver    │  │   Student    │      │
│  │  Dashboard   │  │  Interface   │  │     App      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                │                │                │
│           └────────────────┴────────────────┘                │
│                          │                                   │
│                    React + Socket.io                         │
└────────────────────────────┬────────────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │   API Gateway     │
                   │  (Express.js)     │
                   └─────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│   Auth Layer   │  │  Socket.io      │  │  REST APIs     │
│   (Firebase)   │  │  Real-time      │  │  Routes/Bus    │
└───────┬────────┘  └────────┬────────┘  └───────┬────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │   MongoDB Atlas   │
                   │   (Database)      │
                   └───────────────────┘
```

---

## ⚙️ Installation & Setup

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **Git** - Version control
- **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Firebase Project** - [Console](https://console.firebase.google.com/)
- **Google Cloud Account** - [Console](https://console.cloud.google.com/)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/AbhiGandhi02/bus-tracker-app.git
cd bus-tracker-app
```

### 2️⃣ Backend Setup

Navigate to the server directory:

```bash
cd server
npm install
```

Create a `.env` file in the `server` folder:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/bus-tracker?retryWrites=true&w=majority

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Client Configuration
CLIENT_URL=http://localhost:3000

# Firebase Admin SDK (Base64 encoded service account JSON)
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account

# JWT Secret (optional, if using custom JWT)
JWT_SECRET=your_jwt_secret_key

# Socket.io Configuration
SOCKET_CORS_ORIGIN=http://localhost:3000
```

**Important:** To get the Firebase Service Account Base64:
```bash
# On macOS/Linux
base64 -i path/to/serviceAccountKey.json

# On Windows (PowerShell)
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("path\to\serviceAccountKey.json"))
```

Start the development server:

```bash
npm run dev
```

The backend should now be running on `http://localhost:5000`

### 3️⃣ Frontend Setup

Open a new terminal and navigate to the client directory:

```bash
cd client
npm install
```

Create a `.env` file in the `client` folder:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000

# Google Maps
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

Start the React development server:

```bash
npm start
```

The frontend should now be running on `http://localhost:3000`

---

## 🔐 Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port number | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | Yes |
| `CLIENT_URL` | Frontend URL for CORS | Yes |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Base64 encoded Firebase service account | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Optional |
| `NODE_ENV` | Environment (development/production) | Optional |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | Yes |
| `REACT_APP_SOCKET_URL` | Socket.io server URL | Yes |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Google Maps API key | Yes |
| `REACT_APP_FIREBASE_*` | Firebase configuration keys | Yes |

---

## 🚀 Usage

### For Administrators

1. **Login** with admin credentials
2. Navigate to **Routes** tab to create new bus routes
3. Use **Schedule** section to assign buses and drivers
4. Monitor live buses from **Dashboard**
5. View analytics and reports in **Analytics** tab

### For Drivers

1. **Login** with driver credentials
2. Select assigned route from dashboard
3. Click **Start Trip** to begin broadcasting location
4. GPS coordinates are automatically sent every 5 seconds
5. Click **End Trip** when route is completed

### For Students

1. **Login** or continue as guest
2. View all active buses on the map
3. Click on a bus marker to see details
4. Add routes to favorites for quick access
5. Receive notifications for bus arrivals

---




## 👥 Authors

- **Abhi Gandhi** - *Initial work* - [AbhiGandhi02](https://github.com/AbhiGandhi02)


---

## 📞 Contact

**Project Maintainer:** Abhi Gandhi

- Email: abhigandhi0212@gmail.com
- LinkedIn: [Abhi Gandhi](https://www.linkedin.com/in/abhi-gandhi02/)
- GitHub: [@AbhiGandhi02](https://github.com/AbhiGandhi02)

**Project Link:** [https://github.com/AbhiGandhi02/bus-tracker-app](https://github.com/AbhiGandhi02/bus-tracker-app)

---

## 🙏 Acknowledgments

- Google Maps Platform for mapping APIs
- Firebase for authentication infrastructure
- MongoDB Atlas for database hosting
- Socket.io for real-time capabilities
- The open-source community

---

<div align="center">
  <strong>Built with ❤️ for campus transportation</strong>
  <br>
  <sub>Star ⭐ this repo if you find it helpful!</sub>
</div>