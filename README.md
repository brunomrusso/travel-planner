# Travel Planner

A multi-tenant travel planning application that generates personalized itineraries based on traveler profiles.

## Features

- **User Authentication**: Secure login/registration via Supabase
- **Trip Management**: Create and manage multiple trips
- **Personalized Itineraries**: AI-powered route optimization based on traveler profiles
- **Attraction Discovery**: Automatic discovery of attractions using OpenStreetMap
- **Route Optimization**: Smart routing using OSRM for efficient day-by-day planning
- **Flexible Planning**: Edit and customize itineraries as needed

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **APIs**: OpenStreetMap, OSRM, Nominatim
- **Hosting**: Render

### Frontend
- **Framework**: Next.js (React)
- **Styling**: TailwindCSS
- **Maps**: Leaflet + OpenStreetMap
- **Hosting**: Vercel

## Project Structure

```
travel-planner/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
└── supabase/
    └── migrations/
```

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.example .env
```

5. Add your Supabase credentials to `.env`

6. Run the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

4. Add your Supabase and API credentials to `.env.local`

5. Run development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Supabase Setup

1. Create a new Supabase project
2. Copy the project URL and API keys to your `.env` files
3. Run the migration SQL in the Supabase SQL editor:
```sql
-- Copy contents from supabase/migrations/001_initial_schema.sql
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user

### Trips
- `GET /trips/` - List user's trips
- `POST /trips/` - Create new trip
- `GET /trips/{id}` - Get trip details
- `PUT /trips/{id}` - Update trip
- `DELETE /trips/{id}` - Delete trip
- `POST /trips/{id}/generate-itinerary` - Generate AI itinerary

### Attractions
- `GET /attractions/?city={city}` - Get attractions for a city
- `GET /attractions/{id}` - Get attraction details

### Itineraries
- `GET /itineraries/{trip_id}` - Get trip itinerary
- `POST /itineraries/{trip_id}` - Add itinerary item
- `PUT /itineraries/{trip_id}` - Update itinerary

## Traveler Profiles

1. **Adventure** 🏔️ - Hiking, nature, outdoor activities
2. **Cultural** 🏛️ - Museums, galleries, historic sites
3. **Gastronomic** 🍽️ - Restaurants, cafes, food markets
4. **Relax** 🏖️ - Beaches, spas, parks
5. **Family** 👨‍👩‍👧‍👦 - Kid-friendly attractions, entertainment

## Free APIs Used

- **OpenStreetMap**: POI data and geocoding
- **OSRM**: Route optimization and distance calculation
- **Nominatim**: Address geocoding
- **Leaflet**: Interactive maps

## Deployment

### Backend (Render)
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy automatically on push

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT License
