import { useState, useEffect } from "react";
import "./App.css";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

function App() {
  const [city, setCity] = useState("");
  const [searchedCity, setSearchedCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city.trim() || !showSuggestions || !API_KEY) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city.trim())}&limit=5&appid=${API_KEY}`
        );

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data = await response.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [city, showSuggestions]);

  async function searchWeather(e, selectedPlace = null) {
    if (e) e.preventDefault();

    const cityName = (selectedPlace?.name || city).trim();
    if (!cityName) return;

    if (!API_KEY) {
      setError("API key missing. Check your .env file!");
      return;
    }

    setCity(
      selectedPlace
        ? `${selectedPlace.name}, ${selectedPlace.country}`
        : cityName
    );
    setShowSuggestions(false);
    setError("");
    setWeather(null);
    setSearchedCity("");
    setLoading(true);

    try {
      let place = selectedPlace;

      if (!place) {
        const geoResponse = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`
        );

        if (!geoResponse.ok) throw new Error("API");

        const places = await geoResponse.json();
        if (!places.length) throw new Error("City");

        place = places[0];
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${place.lat}&lon=${place.lon}&appid=${API_KEY}&units=metric`
      );

      if (!response.ok) throw new Error("Weather");

      const data = await response.json();
      setWeather(data);
      setSearchedCity(`${place.name}, ${place.country}`);
    } catch {
      setError(
        "Weather கிடைக்கவில்லை. City name அல்லது API key check பண்ணுங்க!"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <main className="weather-card">
        <p className="tag">YOUR DAILY WEATHER</p>
        <h1>Clima<span>Today</span></h1>
        <p className="subtitle">
          Find the weather, wherever you are.
        </p>

        <form className="search" onSubmit={(e) => searchWeather(e)}>
          <div className="search-box">
            <input
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setWeather(null);
                setSearchedCity("");
                setError("");
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() =>
                setTimeout(() => setShowSuggestions(false), 150)
              }
              placeholder="Enter city name..."
              aria-label="City name"
              autoComplete="off"
            />

            {showSuggestions && city.trim() && (
              <div className="suggestions">
                {suggestions.length > 0 ? (
                  suggestions.map((place, index) => (
                    <button
                      type="button"
                      className="suggestion"
                      key={`${place.lat}-${place.lon}-${index}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => searchWeather(null, place)}
                    >
                      📍 {place.name}, {place.state
                        ? `${place.state}, `
                        : ""}{place.country}
                    </button>
                  ))
                ) : (
                  <p className="no-suggestions">
                    {city.trim().length < 2
                      ? "Type at least 2 letters..."
                      : "Searching for cities..."}
                  </p>
                )}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {weather && (
          <section className="result">
            <p className="location">📍 {searchedCity}</p>
            <div className="temperature">
              {Math.round(weather.main.temp)}°C
            </div>
            <p className="condition">
              {weather.weather[0].description}
            </p>

            <div className="details">
              <div>
                <span>Feels like</span>
                <strong>{Math.round(weather.main.feels_like)}°C</strong>
              </div>
              <div>
                <span>Humidity</span>
                <strong>{weather.main.humidity}%</strong>
              </div>
              <div>
                <span>Wind speed</span>
                <strong>{weather.wind.speed} m/s</strong>
              </div>
            </div>
          </section>
        )}

        {!weather && !error && (
          <div className="welcome">
            <div className="sun">☀️</div>
            <h2>What's the weather like?</h2>
            <p>Search for a city to see its current weather.</p>
          </div>
        )}

        <footer>Made with ☁️ by Suruthi</footer>
      </main>
    </div>
  );
}

export default App;