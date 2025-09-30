# Connect Four (4 in a Row) — Full Project 

A complete implementation of the classic **Connect Four** game with real-time multiplayer support and a competitive bot.  
Now fully deployed — you can play online!

---

##  Live Demo

- **Frontend (Play the Game):** 👉 [https://connect-four-rma3.vercel.app](https://connect-four-rma3.vercel.app)  
- **Backend API:** 👉 [https://connect-four-van4.onrender.com](https://connect-four-van4.onrender.com)  

 Just open the **frontend link** above to start playing. It’s already connected to the backend.

---

##  Tech Stack
- **Backend:** Node.js (Express) + Socket.IO + MongoDB (Mongoose)  
- **Frontend:** React (Vite)  
- **Storage:** Active games in memory + completed games in MongoDB  
- **Bot:** Deterministic strategy (not random)  
- **Features:** Matchmaking, Reconnect, Leaderboard  

---

##  Features
- **Real-time multiplayer** with Socket.IO  
- **Smart bot** prioritizes → *Win* → *Block Opponent* → *Heuristic (center + 3-in-row)*  
- **Persistence:** Completed games stored in MongoDB (`server/models/Game.js`)  
- **Leaderboard API** aggregated from completed games  
- **Reconnect support:** Players can rejoin within 30s  

---

##  Prerequisites
- **Node.js** 18+  
- **npm** or **yarn**  
- **MongoDB** (local or remote)  

---

##  Local Setup

### 1️ Clone the Repo
```bash
git clone https://github.com/vivek955-hub/connect-four.git
cd connect-four
2️ Backend (Server)
bash
Copy code
cd server
cp .env.example .env   # edit values (MONGODB_URI, PORT, CLIENT_ORIGIN)

npm install
npm run start          # production
# OR
npm run dev            # with hot reload
#  Runs at http://localhost:4000
3️ Frontend (Client)
bash
Copy code
cd ../client
npm install
npm run dev
#  Runs at http://localhost:5173
 Deployment
 Backend (Render / Railway / Heroku)
Root directory: server

Build Command:

bash
Copy code
npm install && npm run start
Add environment variables from .env

 Frontend (Render / Vercel / Netlify)
Root directory: client

Build Command:

bash
Copy code
npm run build
Publish/Output Directory: dist

Update API calls to point to deployed backend URL

 API Endpoints
GET /api/leaderboard → Top winners

GET /api/game/:id → Fetch completed game by ID

GET /api/completed-games → List recent completed games

 Author
N Vivek Reddy
🔗 GitHub: vivek955-hub
🔗 LinkedIn: N Vivek Reddy