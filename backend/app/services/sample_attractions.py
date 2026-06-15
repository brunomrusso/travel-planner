"""Sample attractions for popular cities - used as fallback when OSM API is unavailable"""

SAMPLE_ATTRACTIONS = {
    "paris": [
        {"name": "Eiffel Tower", "category": "historic", "latitude": 48.8584, "longitude": 2.2945, "rating": 4.8, "visit_duration_minutes": 120},
        {"name": "Louvre Museum", "category": "museum", "latitude": 48.8606, "longitude": 2.3376, "rating": 4.7, "visit_duration_minutes": 180},
        {"name": "Notre-Dame Cathedral", "category": "historic", "latitude": 48.8530, "longitude": 2.3499, "rating": 4.7, "visit_duration_minutes": 90},
        {"name": "Arc de Triomphe", "category": "historic", "latitude": 48.8738, "longitude": 2.2950, "rating": 4.6, "visit_duration_minutes": 60},
        {"name": "Musée d'Orsay", "category": "museum", "latitude": 48.8600, "longitude": 2.3266, "rating": 4.7, "visit_duration_minutes": 150},
        {"name": "Sacré-Cœur Basilica", "category": "historic", "latitude": 48.8867, "longitude": 2.3431, "rating": 4.7, "visit_duration_minutes": 60},
        {"name": "Palace of Versailles", "category": "historic", "latitude": 48.8049, "longitude": 2.1204, "rating": 4.7, "visit_duration_minutes": 240},
        {"name": "Jardin des Tuileries", "category": "park", "latitude": 48.8634, "longitude": 2.3274, "rating": 4.5, "visit_duration_minutes": 60},
        {"name": "Centre Pompidou", "category": "museum", "latitude": 48.8607, "longitude": 2.3522, "rating": 4.4, "visit_duration_minutes": 120},
        {"name": "Sainte-Chapelle", "category": "historic", "latitude": 48.8554, "longitude": 2.3450, "rating": 4.7, "visit_duration_minutes": 60},
        {"name": "Palais Royal Gardens", "category": "park", "latitude": 48.8638, "longitude": 2.3369, "rating": 4.5, "visit_duration_minutes": 45},
        {"name": "Musée Rodin", "category": "museum", "latitude": 48.8555, "longitude": 2.3161, "rating": 4.6, "visit_duration_minutes": 90},
        {"name": "Luxembourg Gardens", "category": "park", "latitude": 48.8462, "longitude": 2.3372, "rating": 4.6, "visit_duration_minutes": 60},
        {"name": "Marché d'Aligre", "category": "market", "latitude": 48.8497, "longitude": 2.3791, "rating": 4.4, "visit_duration_minutes": 45},
        {"name": "Le Procope", "category": "restaurant", "latitude": 48.8526, "longitude": 2.3397, "rating": 4.3, "visit_duration_minutes": 90},
        {"name": "Café de Flore", "category": "restaurant", "latitude": 48.8542, "longitude": 2.3328, "rating": 4.2, "visit_duration_minutes": 60},
        {"name": "Musée de l'Armée", "category": "museum", "latitude": 48.8553, "longitude": 2.3124, "rating": 4.5, "visit_duration_minutes": 120},
        {"name": "Champs-Élysées", "category": "entertainment", "latitude": 48.8698, "longitude": 2.3078, "rating": 4.4, "visit_duration_minutes": 90},
        {"name": "Île de la Cité", "category": "historic", "latitude": 48.8553, "longitude": 2.3479, "rating": 4.5, "visit_duration_minutes": 60},
        {"name": "Galeries Lafayette", "category": "entertainment", "latitude": 48.8736, "longitude": 2.3323, "rating": 4.3, "visit_duration_minutes": 90},
    ],
    "london": [
        {"name": "Tower of London", "category": "historic", "latitude": 51.5081, "longitude": -0.0759, "rating": 4.6, "visit_duration_minutes": 150},
        {"name": "British Museum", "category": "museum", "latitude": 51.5194, "longitude": -0.1270, "rating": 4.7, "visit_duration_minutes": 180},
        {"name": "Buckingham Palace", "category": "historic", "latitude": 51.5014, "longitude": -0.1419, "rating": 4.5, "visit_duration_minutes": 90},
        {"name": "Hyde Park", "category": "park", "latitude": 51.5073, "longitude": -0.1657, "rating": 4.6, "visit_duration_minutes": 90},
        {"name": "National Gallery", "category": "museum", "latitude": 51.5089, "longitude": -0.1283, "rating": 4.7, "visit_duration_minutes": 150},
        {"name": "Big Ben", "category": "historic", "latitude": 51.5007, "longitude": -0.1246, "rating": 4.6, "visit_duration_minutes": 45},
        {"name": "Tate Modern", "category": "gallery", "latitude": 51.5076, "longitude": -0.0994, "rating": 4.6, "visit_duration_minutes": 120},
        {"name": "Borough Market", "category": "market", "latitude": 51.5055, "longitude": -0.0910, "rating": 4.6, "visit_duration_minutes": 60},
    ],
    "tokyo": [
        {"name": "Senso-ji Temple", "category": "historic", "latitude": 35.7148, "longitude": 139.7967, "rating": 4.7, "visit_duration_minutes": 90},
        {"name": "Tokyo National Museum", "category": "museum", "latitude": 35.7188, "longitude": 139.7760, "rating": 4.5, "visit_duration_minutes": 150},
        {"name": "Shinjuku Gyoen", "category": "park", "latitude": 35.6851, "longitude": 139.7100, "rating": 4.6, "visit_duration_minutes": 90},
        {"name": "Tokyo Tower", "category": "entertainment", "latitude": 35.6586, "longitude": 139.7454, "rating": 4.5, "visit_duration_minutes": 90},
        {"name": "Tsukiji Outer Market", "category": "market", "latitude": 35.6654, "longitude": 139.7707, "rating": 4.4, "visit_duration_minutes": 60},
    ],
    "new york": [
        {"name": "Central Park", "category": "park", "latitude": 40.7829, "longitude": -73.9654, "rating": 4.8, "visit_duration_minutes": 120},
        {"name": "Metropolitan Museum of Art", "category": "museum", "latitude": 40.7794, "longitude": -73.9632, "rating": 4.8, "visit_duration_minutes": 180},
        {"name": "Statue of Liberty", "category": "historic", "latitude": 40.6892, "longitude": -74.0445, "rating": 4.7, "visit_duration_minutes": 180},
        {"name": "Brooklyn Bridge", "category": "historic", "latitude": 40.7061, "longitude": -73.9969, "rating": 4.7, "visit_duration_minutes": 60},
        {"name": "Times Square", "category": "entertainment", "latitude": 40.7580, "longitude": -73.9855, "rating": 4.3, "visit_duration_minutes": 60},
    ],
    "barcelona": [
        {"name": "Sagrada Família", "category": "historic", "latitude": 41.4036, "longitude": 2.1744, "rating": 4.8, "visit_duration_minutes": 120},
        {"name": "Park Güell", "category": "park", "latitude": 41.4145, "longitude": 2.1527, "rating": 4.6, "visit_duration_minutes": 90},
        {"name": "Museu Picasso", "category": "museum", "latitude": 41.3851, "longitude": 2.1809, "rating": 4.5, "visit_duration_minutes": 120},
        {"name": "La Boqueria Market", "category": "market", "latitude": 41.3817, "longitude": 2.1722, "rating": 4.4, "visit_duration_minutes": 60},
        {"name": "Camp Nou", "category": "entertainment", "latitude": 41.3809, "longitude": 2.1228, "rating": 4.6, "visit_duration_minutes": 120},
    ],
    "rome": [
        {"name": "Colosseum", "category": "historic", "latitude": 41.8902, "longitude": 12.4922, "rating": 4.8, "visit_duration_minutes": 150},
        {"name": "Vatican Museums", "category": "museum", "latitude": 41.9065, "longitude": 12.4536, "rating": 4.7, "visit_duration_minutes": 180},
        {"name": "Trevi Fountain", "category": "historic", "latitude": 41.9009, "longitude": 12.4833, "rating": 4.7, "visit_duration_minutes": 45},
        {"name": "Pantheon", "category": "historic", "latitude": 41.8986, "longitude": 12.4769, "rating": 4.8, "visit_duration_minutes": 60},
        {"name": "Villa Borghese Gardens", "category": "park", "latitude": 41.9138, "longitude": 12.4922, "rating": 4.6, "visit_duration_minutes": 90},
    ],
}


def get_sample_attractions(city: str):
    """Return sample attractions for a city, case-insensitive."""
    return SAMPLE_ATTRACTIONS.get(city.lower(), [])
