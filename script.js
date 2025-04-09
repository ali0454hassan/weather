document.addEventListener('DOMContentLoaded', function() {
    // Check if there's a saved city in local storage
    const savedCity = localStorage.getItem('lastSearchedCity');
    if (savedCity) {
        document.getElementById('cityInput').value = savedCity;
        fetchWeatherData(savedCity);
    }
});

document.getElementById('searchButton').addEventListener('click', function() {
    const cityInput = document.getElementById('cityInput').value.trim();
    if (cityInput !== '') {
        fetchWeatherData(cityInput);
    } else {
        showError('Please enter a city name');
    }
});

document.getElementById('cityInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('searchButton').click();
    }
});

async function fetchWeatherData(city) {
    const apiKey = '1bded7a177c84a01b43191258242506';  // Your WeatherAPI key
    const weatherInfo = document.querySelector('.weather-info');
    const forecastInfo = document.querySelector('.forecast-info');
    const errorAlert = document.getElementById('errorAlert');
    const hourlyForecastCard = document.getElementById('hourlyForecastCard');
    
    // Show loading state (you can add a spinner here if you want)
    weatherInfo.classList.add('d-none');
    forecastInfo.classList.add('d-none');
    errorAlert.classList.add('d-none');
    
    try {
        console.log(`Fetching weather data for: ${city}`);
        
        // Fetch all weather data in one call to save API requests
        const forecastResponse = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=3&aqi=yes&alerts=yes`);
        console.log(`Forecast response status: ${forecastResponse.status}`);
        
        if (!forecastResponse.ok) {
            if (forecastResponse.status === 400 || forecastResponse.status === 404) {
                throw new Error('City not found. Please check the spelling and try again.');
            } else {
                throw new Error('Failed to fetch weather data. Please try again later.');
            }
        }
        
        const weatherData = await forecastResponse.json();
        console.log('Weather data:', weatherData);
        
        // Save the successfully searched city to local storage
        localStorage.setItem('lastSearchedCity', city);
        
        // Update current weather information
        updateCurrentWeather(weatherData);
        
        // Update forecast information
        updateForecast(weatherData);
        
        // Update hourly forecast for today
        updateHourlyForecast(weatherData);
        
        // Show the weather and forecast sections
        weatherInfo.classList.remove('d-none');
        forecastInfo.classList.remove('d-none');
        hourlyForecastCard.classList.remove('d-none');
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}

function updateCurrentWeather(data) {
    // Location and basic info
    document.getElementById('cityName').textContent = `${data.location.name}, ${data.location.country}`;
    document.getElementById('localTime').textContent = formatLocalTime(data.location.localtime);
    document.getElementById('temperature').textContent = `${data.current.temp_c}°C`;
    document.getElementById('weatherDescription').textContent = data.current.condition.text;
    document.getElementById('weatherIcon').src = `https:${data.current.condition.icon}`;
    
    // Additional metrics
    document.getElementById('feelsLike').textContent = `${data.current.feelslike_c}°C`;
    document.getElementById('humidity').textContent = `${data.current.humidity}%`;
    document.getElementById('windSpeed').textContent = `${data.current.wind_kph} km/h`;
    document.getElementById('windDirection').textContent = `${data.current.wind_dir} (${data.current.wind_degree}°)`;
    document.getElementById('pressure').textContent = `${data.current.pressure_mb} mb`;
    document.getElementById('visibility').textContent = `${data.current.vis_km} km`;
    document.getElementById('uvIndex').textContent = getUVDescription(data.current.uv);
    document.getElementById('precipitation').textContent = `${data.current.precip_mm} mm`;
    document.getElementById('cloud').textContent = `${data.current.cloud}%`;
    
    // Sun & Moon info
    document.getElementById('sunrise').textContent = data.forecast.forecastday[0].astro.sunrise;
    document.getElementById('sunset').textContent = data.forecast.forecastday[0].astro.sunset;
    
    // Today's chance of rain
    document.getElementById('chanceOfRain').textContent = `${data.forecast.forecastday[0].day.daily_chance_of_rain}%`;
}

function updateForecast(data) {
    const forecastElement = document.getElementById('forecast');
    forecastElement.innerHTML = '';
    
    data.forecast.forecastday.forEach((day, index) => {
        const date = new Date(day.date);
        const dayName = getDayName(date, index);
        
        const forecastDayElement = document.createElement('div');
        forecastDayElement.className = 'col-md-4 mb-3';
        
        const cardClass = index === 0 ? 'border-primary' : '';
        
        forecastDayElement.innerHTML = `
            <div class="card h-100 ${cardClass}">
                <div class="card-header ${index === 0 ? 'bg-primary text-white' : 'bg-light'}">
                    <h5 class="mb-0">${dayName}</h5>
                    <small>${formatDate(day.date)}</small>
                </div>
                <div class="card-body text-center">
                    <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" class="forecast-icon">
                    <h4 class="mt-2">${day.day.condition.text}</h4>
                    <div class="row mt-3">
                        <div class="col-6">
                            <p class="temp-label">Max</p>
                            <p class="temp-value text-danger">${day.day.maxtemp_c}°C</p>
                        </div>
                        <div class="col-6">
                            <p class="temp-label">Min</p>
                            <p class="temp-value text-primary">${day.day.mintemp_c}°C</p>
                        </div>
                    </div>
                    <div class="forecast-details mt-3">
                        <div class="row">
                            <div class="col-6 text-start">
                                <p><i class="fas fa-tint text-primary me-2"></i> Humidity</p>
                            </div>
                            <div class="col-6 text-end">
                                <p>${day.day.avghumidity}%</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-6 text-start">
                                <p><i class="fas fa-cloud-rain text-primary me-2"></i> Chance of Rain</p>
                            </div>
                            <div class="col-6 text-end">
                                <p>${day.day.daily_chance_of_rain}%</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-6 text-start">
                                <p><i class="fas fa-wind text-primary me-2"></i> Max Wind</p>
                            </div>
                            <div class="col-6 text-end">
                                <p>${day.day.maxwind_kph} km/h</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <p class="mb-0">${getWeatherConditionText(day.day.condition.text)}</p>
                </div>
            </div>
        `;
        
        forecastElement.appendChild(forecastDayElement);
    });
}

function updateHourlyForecast(data) {
    const hourlyForecastElement = document.getElementById('hourlyForecast');
    hourlyForecastElement.innerHTML = '';
    
    // Get current hour to display only future hours
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    
    // Filter to show only future hours of today
    const todayHours = data.forecast.forecastday[0].hour.filter(hourData => {
        const hourTime = new Date(hourData.time);
        return hourTime.getHours() >= currentHour;
    });
    
    // If there are very few hours left today, add some hours from tomorrow
    if (todayHours.length <= 4 && data.forecast.forecastday.length > 1) {
        const tomorrowHours = data.forecast.forecastday[1].hour.slice(0, 24 - todayHours.length);
        todayHours.push(...tomorrowHours);
    }
    
    // Limit to showing max 12 hours
    const hoursToShow = todayHours.slice(0, 12);
    
    hoursToShow.forEach(hour => {
        const hourTime = new Date(hour.time);
        const formattedTime = hourTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formattedTime}</td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="https:${hour.condition.icon}" alt="${hour.condition.text}" width="40">
                    <span class="ms-2">${hour.condition.text}</span>
                </div>
            </td>
            <td>${hour.temp_c}°C</td>
            <td>${hour.chance_of_rain}%</td>
            <td>${hour.wind_kph} km/h ${hour.wind_dir}</td>
        `;
        
        hourlyForecastElement.appendChild(row);
    });
}

function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');
    
    document.querySelector('.weather-info').classList.add('d-none');
    document.querySelector('.forecast-info').classList.add('d-none');
}

function formatLocalTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return date.toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function getDayName(date, index) {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    
    return date.toLocaleDateString(undefined, { weekday: 'long' });
}

function getUVDescription(uvIndex) {
    if (uvIndex <= 2) return `${uvIndex} (Low)`;
    if (uvIndex <= 5) return `${uvIndex} (Moderate)`;
    if (uvIndex <= 7) return `${uvIndex} (High)`;
    if (uvIndex <= 10) return `${uvIndex} (Very High)`;
    return `${uvIndex} (Extreme)`;
}

function getWeatherConditionText(condition) {
    // Enhanced mapping of weather conditions to meaningful advice
    const conditions = {
        'Sunny': 'Clear skies and sunny weather. Great day for outdoor activities! Don\'t forget sunscreen.',
        'Clear': 'Clear skies expected. Perfect weather to enjoy outdoor activities.',
        'Partly cloudy': 'Partly cloudy with some sun breaks. Comfortable conditions for most activities.',
        'Cloudy': 'Cloudy skies expected. Temperature should remain stable throughout the day.',
        'Overcast': 'Overcast skies with limited sunshine. Consider indoor activities if you prefer sunshine.',
        'Mist': 'Misty conditions with reduced visibility. Drive carefully if traveling.',
        'Fog': 'Foggy conditions with significantly reduced visibility. Take extra caution when driving.',
        'Patchy rain possible': 'Patchy rain possible. Consider bringing an umbrella just in case.',
        'Patchy snow possible': 'Patchy snow possible. Dress warmly and be prepared for changing conditions.',
        'Patchy sleet possible': 'Patchy sleet possible. Roads may be slippery; drive with caution.',
        'Patchy freezing drizzle possible': 'Freezing drizzle possible. Watch for slippery surfaces when walking or driving.',
        'Thundery outbreaks possible': 'Possible thunderstorms. Stay indoors during electrical storms.',
        'Blowing snow': 'Blowing snow with poor visibility. Not recommended for travel if avoidable.',
        'Blizzard': 'Blizzard conditions with heavy snow and strong winds. Avoid travel if possible.',
        'Light Rain': 'Light rain expected. An umbrella would be useful but conditions are mild.',
        'Moderate rain': 'Moderate rain expected. Bring waterproof clothing and umbrella.',
        'Heavy rain': 'Heavy rain expected. Flooding may occur in low-lying areas. Consider postponing outdoor plans.',
        'Light snow': 'Light snow expected. Minor accumulation possible on grassy surfaces.',
        'Moderate snow': 'Moderate snow expected. Prepare for snow accumulation and adjust travel plans accordingly.',
        'Heavy snow': 'Heavy snow expected. Significant accumulation likely. Avoid unnecessary travel.',
        'Light rain shower': 'Light rain showers, generally brief in nature. May be interspersed with dry periods.',
        'Moderate or heavy rain shower': 'Moderate to heavy rain showers. Keep an umbrella handy throughout the day.',
        'Torrential rain shower': 'Torrential rain showers expected. Flash flooding possible. Avoid low-lying areas.',
        'Light sleet': 'Light sleet expected. Roads may become slippery, especially on bridges and overpasses.',
        'Moderate or heavy sleet': 'Moderate to heavy sleet expected. Travel conditions will be difficult.',
        'Light snow showers': 'Light snow showers expected, with minimal accumulation.',
        'Moderate or heavy snow showers': 'Moderate to heavy snow showers with accumulation likely. Be prepared for winter conditions.',
        'Patchy light rain with thunder': 'Light rain with thunder possible. Stay alert for changing conditions.',
        'Moderate or heavy rain with thunder': 'Thunderstorms with moderate to heavy rain expected. Stay indoors during storms.'
    };

    // Return a default message if condition is not in the map
    return conditions[condition] || 'Check local weather updates for specific conditions and recommendations.';
}