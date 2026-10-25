
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const statusMessage = document.getElementById("status");
const weatherContent = document.getElementById("weather-content");

const weatherCodes = {
    0: ["Clear sky", "☀️"],
    1: ["Mainly clear", "🌤️"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Foggy", "🌫️"],
    48: ["Depositing rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Moderate drizzle", "🌦️"],
    55: ["Dense drizzle", "🌧️"],
    61: ["Slight rain", "🌦️"],
    63: ["Moderate rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    71: ["Slight snowfall", "🌨️"],
    73: ["Moderate snowfall", "❄️"],
    75: ["Heavy snowfall", "❄️"],
    80: ["Rain showers", "🌦️"],
    81: ["Moderate rain showers", "🌧️"],
    82: ["Violent rain showers", "⛈️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with hail", "⛈️"],
    99: ["Thunderstorm with heavy hail", "⛈️"]
};

function setStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("error", isError);
}

async function getJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Request failed (HTTP ${response.status}).`);
    }

    return await response.json();
}

async function getWeather(city) {
    searchButton.disabled = true;
    searchButton.textContent = "Loading...";
    setStatus("Fetching weather data...");
    weatherContent.hidden = true;

    try {
        // Step 1: Find the city's latitude and longitude.
        const geoURL =
            `https://geocoding-api.open-meteo.com/v1/search` +
            `?name=${encodeURIComponent(city)}&count=10&language=en&format=json`;

        const geoData = await getJSON(geoURL);

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(
                "City not found. Check the spelling and try again."
            );
        }

        // Prefer an exact city-name match where possible.
        const location = geoData.results.find(
            place => place.name.toLowerCase() === city.toLowerCase()
        ) || geoData.results[0];

        const { latitude, longitude, name, country, admin1 } = location;

        // Step 2: Fetch current weather for the city's coordinates.
        const weatherURL =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
            `&timezone=auto`;

        const weatherData = await getJSON(weatherURL);

        // Step 3: Read the nested JSON object safely.
        const current = weatherData.current;

        if (!current) {
            throw new Error("Current weather data is unavailable.");
        }

        // Step 4: Render the returned data in the dashboard.
        document.getElementById("city-name").textContent =
            [name, admin1, country].filter(Boolean).join(", ");

        document.getElementById("temperature").textContent =
            current.temperature_2m ?? "--";

        document.getElementById("feels-like").textContent =
            current.apparent_temperature ?? "--";

        document.getElementById("humidity").textContent =
            current.relative_humidity_2m ?? "--";

        document.getElementById("wind-speed").textContent =
            current.wind_speed_10m ?? "--";

        const [description, icon] =
            weatherCodes[current.weather_code] ||
            ["Weather conditions unavailable", "🌡️"];

        document.getElementById("weather-description").textContent =
            description;

        document.getElementById("weather-icon").textContent = icon;

        document.getElementById("updated-time").textContent =
            `Local time: ${current.time.replace("T", " ")}`;

        weatherContent.hidden = false;
        setStatus("Weather updated successfully!");
    } catch (error) {
        console.error("Weather dashboard error:", error);

        if (error instanceof TypeError) {
            setStatus(
                "Network error. Check your internet connection and try again.",
                true
            );
        } else {
            setStatus(error.message || "Something went wrong.", true);
        }
    } finally {
        searchButton.disabled = false;
        searchButton.textContent = "Search";
    }
}

// Handle the search form.
searchForm.addEventListener("submit", event => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        setStatus("Please enter a city name.", true);
        return;
    }

    getWeather(city);
});

// Load a default city when the page opens.
getWeather("Chennai");
