"""Sample attractions for popular cities - used as fallback when OSM API is unavailable"""

# Maps Portuguese (and variant) city names to the key used in SAMPLE_ATTRACTIONS
CITY_ALIASES: dict[str, str] = {
    # Czech Republic
    "praga": "prague", "praha": "prague",
    # UK
    "londres": "london",
    # Italy
    "roma": "rome",
    # Germany
    "berlim": "berlin",
    # Netherlands
    "amsterdã": "amsterdam", "amsterdam": "amsterdam",
    # Portugal
    "lisboa": "lisbon",
    # Spain
    "madri": "madrid", "madrid": "madrid",
    # Greece
    "atenas": "athens",
    # Hungary
    "budapeste": "budapest",
    # Austria
    "viena": "vienna",
    # USA
    "nova york": "new york", "nova iorque": "new york",
    "los angeles": "los angeles",
    "miami": "miami",
    # Japan
    "tóquio": "tokyo", "tokio": "tokyo",
    "osaka": "osaka",
    # Brazil
    "são paulo": "sao paulo", "sao paulo": "sao paulo",
    "rio de janeiro": "rio de janeiro",
    # Argentina
    "buenos aires": "buenos aires",
    # Mexico
    "cidade do méxico": "mexico city", "mexico city": "mexico city",
    # Thailand
    "banguecoque": "bangkok", "bangkok": "bangkok",
    # Singapore
    "cingapura": "singapore", "singapore": "singapore",
    # UAE
    "dubai": "dubai",
    # Australia
    "sydney": "sydney",
}

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
        {"name": "Roman Forum", "category": "historic", "latitude": 41.8925, "longitude": 12.4853, "rating": 4.6, "visit_duration_minutes": 90},
        {"name": "Piazza Navona", "category": "historic", "latitude": 41.8992, "longitude": 12.4730, "rating": 4.7, "visit_duration_minutes": 45},
    ],
    "prague": [
        {"name": "Prague Castle", "category": "historic", "latitude": 50.0910, "longitude": 14.4018, "rating": 4.7, "visit_duration_minutes": 180},
        {"name": "Charles Bridge", "category": "historic", "latitude": 50.0865, "longitude": 14.4114, "rating": 4.7, "visit_duration_minutes": 60},
        {"name": "Old Town Square", "category": "historic", "latitude": 50.0875, "longitude": 14.4213, "rating": 4.7, "visit_duration_minutes": 90},
        {"name": "Astronomical Clock", "category": "historic", "latitude": 50.0870, "longitude": 14.4202, "rating": 4.5, "visit_duration_minutes": 30},
        {"name": "St. Vitus Cathedral", "category": "historic", "latitude": 50.0903, "longitude": 14.4002, "rating": 4.7, "visit_duration_minutes": 90},
        {"name": "Petřín Hill and Tower", "category": "park", "latitude": 50.0833, "longitude": 14.3958, "rating": 4.6, "visit_duration_minutes": 90},
        {"name": "Josefov - Jewish Quarter", "category": "historic", "latitude": 50.0896, "longitude": 14.4181, "rating": 4.6, "visit_duration_minutes": 120},
        {"name": "National Museum Prague", "category": "museum", "latitude": 50.0775, "longitude": 14.4310, "rating": 4.4, "visit_duration_minutes": 120},
        {"name": "Wenceslas Square", "category": "historic", "latitude": 50.0812, "longitude": 14.4278, "rating": 4.4, "visit_duration_minutes": 45},
        {"name": "Prague Zoo", "category": "zoo", "latitude": 50.1167, "longitude": 14.4083, "rating": 4.7, "visit_duration_minutes": 180},
        {"name": "Café Louvre", "category": "restaurant", "latitude": 50.0822, "longitude": 14.4180, "rating": 4.3, "visit_duration_minutes": 60},
        {"name": "Vyšehrad Fortress", "category": "historic", "latitude": 50.0648, "longitude": 14.4183, "rating": 4.6, "visit_duration_minutes": 90},
    ],
    "amsterdam": [
        {"name": "Rijksmuseum", "category": "museum", "latitude": 52.3600, "longitude": 4.8852, "rating": 4.8, "visit_duration_minutes": 180},
        {"name": "Van Gogh Museum", "category": "museum", "latitude": 52.3584, "longitude": 4.8811, "rating": 4.7, "visit_duration_minutes": 150},
        {"name": "Anne Frank House", "category": "historic", "latitude": 52.3752, "longitude": 4.8840, "rating": 4.6, "visit_duration_minutes": 90},
        {"name": "Vondelpark", "category": "park", "latitude": 52.3582, "longitude": 4.8686, "rating": 4.6, "visit_duration_minutes": 60},
        {"name": "Amsterdam Canals", "category": "historic", "latitude": 52.3676, "longitude": 4.9041, "rating": 4.7, "visit_duration_minutes": 90},
        {"name": "Albert Cuyp Market", "category": "market", "latitude": 52.3548, "longitude": 4.8952, "rating": 4.4, "visit_duration_minutes": 60},
        {"name": "Stedelijk Museum", "category": "museum", "latitude": 52.3580, "longitude": 4.8797, "rating": 4.5, "visit_duration_minutes": 120},
    ],
    "berlin": [
        {"name": "Brandenburg Gate", "category": "historic", "latitude": 52.5163, "longitude": 13.3777, "rating": 4.7, "visit_duration_minutes": 45},
        {"name": "Berlin Wall Memorial", "category": "historic", "latitude": 52.5352, "longitude": 13.3903, "rating": 4.6, "visit_duration_minutes": 90},
        {"name": "Pergamon Museum", "category": "museum", "latitude": 52.5211, "longitude": 13.3970, "rating": 4.6, "visit_duration_minutes": 150},
        {"name": "Tiergarten Park", "category": "park", "latitude": 52.5145, "longitude": 13.3501, "rating": 4.6, "visit_duration_minutes": 90},
        {"name": "Checkpoint Charlie", "category": "historic", "latitude": 52.5076, "longitude": 13.3904, "rating": 4.4, "visit_duration_minutes": 45},
        {"name": "Reichstag Building", "category": "historic", "latitude": 52.5186, "longitude": 13.3762, "rating": 4.6, "visit_duration_minutes": 90},
        {"name": "East Side Gallery", "category": "gallery", "latitude": 52.5051, "longitude": 13.4400, "rating": 4.6, "visit_duration_minutes": 60},
    ],
    "lisbon": [
        {"name": "Belém Tower", "category": "historic", "latitude": 38.6916, "longitude": -9.2160, "rating": 4.5, "visit_duration_minutes": 60},
        {"name": "Jerónimos Monastery", "category": "historic", "latitude": 38.6978, "longitude": -9.2067, "rating": 4.7, "visit_duration_minutes": 90},
        {"name": "São Jorge Castle", "category": "historic", "latitude": 38.7139, "longitude": -9.1334, "rating": 4.5, "visit_duration_minutes": 90},
        {"name": "Alfama District", "category": "historic", "latitude": 38.7122, "longitude": -9.1319, "rating": 4.6, "visit_duration_minutes": 120},
        {"name": "LX Factory", "category": "market", "latitude": 38.7028, "longitude": -9.1778, "rating": 4.5, "visit_duration_minutes": 90},
        {"name": "Museu Nacional do Azulejo", "category": "museum", "latitude": 38.7225, "longitude": -9.1095, "rating": 4.6, "visit_duration_minutes": 90},
    ],
    "budapest": [
        {"name": "Hungarian Parliament Building", "category": "historic", "latitude": 47.5071, "longitude": 19.0455, "rating": 4.8, "visit_duration_minutes": 90},
        {"name": "Buda Castle", "category": "historic", "latitude": 47.4960, "longitude": 19.0398, "rating": 4.6, "visit_duration_minutes": 120},
        {"name": "Széchenyi Thermal Bath", "category": "spa", "latitude": 47.5189, "longitude": 19.0817, "rating": 4.6, "visit_duration_minutes": 180},
        {"name": "Fisherman's Bastion", "category": "historic", "latitude": 47.5018, "longitude": 19.0348, "rating": 4.7, "visit_duration_minutes": 60},
        {"name": "Ruin Bars - Szimpla Kert", "category": "entertainment", "latitude": 47.4998, "longitude": 19.0648, "rating": 4.5, "visit_duration_minutes": 90},
        {"name": "Great Market Hall", "category": "market", "latitude": 47.4876, "longitude": 19.0580, "rating": 4.5, "visit_duration_minutes": 60},
        {"name": "Heroes' Square", "category": "historic", "latitude": 47.5149, "longitude": 19.0770, "rating": 4.6, "visit_duration_minutes": 45},
    ],
    "vienna": [
        {"name": "Schönbrunn Palace", "category": "historic", "latitude": 48.1845, "longitude": 16.3122, "rating": 4.7, "visit_duration_minutes": 180},
        {"name": "St. Stephen's Cathedral", "category": "historic", "latitude": 48.2085, "longitude": 16.3731, "rating": 4.7, "visit_duration_minutes": 60},
        {"name": "Kunsthistorisches Museum", "category": "museum", "latitude": 48.2035, "longitude": 16.3617, "rating": 4.7, "visit_duration_minutes": 150},
        {"name": "Belvedere Palace", "category": "historic", "latitude": 48.1914, "longitude": 16.3808, "rating": 4.7, "visit_duration_minutes": 120},
        {"name": "Vienna State Opera", "category": "entertainment", "latitude": 48.2029, "longitude": 16.3693, "rating": 4.7, "visit_duration_minutes": 120},
        {"name": "Naschmarkt", "category": "market", "latitude": 48.1993, "longitude": 16.3625, "rating": 4.5, "visit_duration_minutes": 60},
    ],
    "madrid": [
        {"name": "Museo del Prado", "category": "museum", "latitude": 40.4138, "longitude": -3.6921, "rating": 4.8, "visit_duration_minutes": 180},
        {"name": "Royal Palace of Madrid", "category": "historic", "latitude": 40.4179, "longitude": -3.7142, "rating": 4.6, "visit_duration_minutes": 120},
        {"name": "Retiro Park", "category": "park", "latitude": 40.4153, "longitude": -3.6844, "rating": 4.7, "visit_duration_minutes": 90},
        {"name": "Museo Reina Sofía", "category": "museum", "latitude": 40.4083, "longitude": -3.6940, "rating": 4.7, "visit_duration_minutes": 150},
        {"name": "Plaza Mayor", "category": "historic", "latitude": 40.4154, "longitude": -3.7074, "rating": 4.6, "visit_duration_minutes": 45},
        {"name": "Mercado de San Miguel", "category": "market", "latitude": 40.4152, "longitude": -3.7089, "rating": 4.4, "visit_duration_minutes": 60},
    ],
    "rio de janeiro": [
        {"name": "Cristo Redentor", "category": "historic", "latitude": -22.9519, "longitude": -43.2105, "rating": 4.8, "visit_duration_minutes": 120},
        {"name": "Pão de Açúcar", "category": "park", "latitude": -22.9488, "longitude": -43.1557, "rating": 4.8, "visit_duration_minutes": 150},
        {"name": "Praia de Copacabana", "category": "beach", "latitude": -22.9711, "longitude": -43.1822, "rating": 4.6, "visit_duration_minutes": 120},
        {"name": "Jardim Botânico", "category": "park", "latitude": -22.9668, "longitude": -43.2235, "rating": 4.7, "visit_duration_minutes": 120},
        {"name": "Museu Nacional de Belas Artes", "category": "museum", "latitude": -22.9097, "longitude": -43.1756, "rating": 4.5, "visit_duration_minutes": 90},
        {"name": "Escadaria Selarón", "category": "historic", "latitude": -22.9143, "longitude": -43.1790, "rating": 4.7, "visit_duration_minutes": 30},
        {"name": "Praia de Ipanema", "category": "beach", "latitude": -22.9836, "longitude": -43.2019, "rating": 4.7, "visit_duration_minutes": 120},
    ],
    "sao paulo": [
        {"name": "Museu de Arte de São Paulo (MASP)", "category": "museum", "latitude": -23.5613, "longitude": -46.6557, "rating": 4.7, "visit_duration_minutes": 120},
        {"name": "Parque Ibirapuera", "category": "park", "latitude": -23.5874, "longitude": -46.6576, "rating": 4.7, "visit_duration_minutes": 120},
        {"name": "Pinacoteca do Estado", "category": "museum", "latitude": -23.5348, "longitude": -46.6335, "rating": 4.6, "visit_duration_minutes": 90},
        {"name": "Mercado Municipal", "category": "market", "latitude": -23.5416, "longitude": -46.6280, "rating": 4.5, "visit_duration_minutes": 60},
        {"name": "Liberdade (Bairro Japonês)", "category": "historic", "latitude": -23.5593, "longitude": -46.6338, "rating": 4.4, "visit_duration_minutes": 90},
    ],
    "athens": [
        {"name": "Acropolis", "category": "historic", "latitude": 37.9715, "longitude": 23.7267, "rating": 4.8, "visit_duration_minutes": 150},
        {"name": "Parthenon", "category": "historic", "latitude": 37.9714, "longitude": 23.7267, "rating": 4.8, "visit_duration_minutes": 90},
        {"name": "National Archaeological Museum", "category": "museum", "latitude": 37.9893, "longitude": 23.7322, "rating": 4.6, "visit_duration_minutes": 150},
        {"name": "Plaka District", "category": "historic", "latitude": 37.9745, "longitude": 23.7305, "rating": 4.6, "visit_duration_minutes": 90},
        {"name": "Temple of Olympian Zeus", "category": "historic", "latitude": 37.9694, "longitude": 23.7331, "rating": 4.5, "visit_duration_minutes": 45},
    ],
    "dubai": [
        {"name": "Burj Khalifa", "category": "entertainment", "latitude": 25.1972, "longitude": 55.2744, "rating": 4.7, "visit_duration_minutes": 120},
        {"name": "Dubai Mall", "category": "entertainment", "latitude": 25.1975, "longitude": 55.2796, "rating": 4.5, "visit_duration_minutes": 180},
        {"name": "Dubai Creek", "category": "historic", "latitude": 25.2632, "longitude": 55.3069, "rating": 4.5, "visit_duration_minutes": 90},
        {"name": "Palm Jumeirah", "category": "entertainment", "latitude": 25.1124, "longitude": 55.1390, "rating": 4.5, "visit_duration_minutes": 120},
        {"name": "Gold Souk", "category": "market", "latitude": 25.2852, "longitude": 55.3038, "rating": 4.5, "visit_duration_minutes": 60},
    ],
    "buenos aires": [
        {"name": "La Boca - Caminito", "category": "historic", "latitude": -34.6345, "longitude": -58.3631, "rating": 4.5, "visit_duration_minutes": 90},
        {"name": "Casa Rosada", "category": "historic", "latitude": -34.6084, "longitude": -58.3704, "rating": 4.5, "visit_duration_minutes": 45},
        {"name": "Cementerio de la Recoleta", "category": "historic", "latitude": -34.5872, "longitude": -58.3936, "rating": 4.6, "visit_duration_minutes": 60},
        {"name": "MALBA Museum", "category": "museum", "latitude": -34.5776, "longitude": -58.4040, "rating": 4.6, "visit_duration_minutes": 120},
        {"name": "Mercado de San Telmo", "category": "market", "latitude": -34.6213, "longitude": -58.3701, "rating": 4.4, "visit_duration_minutes": 60},
        {"name": "Teatro Colón", "category": "entertainment", "latitude": -34.6011, "longitude": -58.3834, "rating": 4.8, "visit_duration_minutes": 90},
    ],
}


def get_sample_attractions(city: str):
    """Return sample attractions for a city, case-insensitive. Resolves Portuguese aliases."""
    key = city.strip().lower()
    # Try direct match first
    if key in SAMPLE_ATTRACTIONS:
        return SAMPLE_ATTRACTIONS[key]
    # Try alias lookup
    resolved = CITY_ALIASES.get(key)
    if resolved and resolved in SAMPLE_ATTRACTIONS:
        return SAMPLE_ATTRACTIONS[resolved]
    return []
