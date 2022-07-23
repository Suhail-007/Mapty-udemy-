'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//get Coordinates
		function showPos () {
			navigator.geolocation.getCurrentPosition(
		function (position) {
		const {latitude} = position.coords;
		const {longitude} = position.coords;
		const coords = [latitude, longitude];
		
		const map = L.map('map').setView(coords, 13);
		L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
    
    
  //click event on map
		map.on('click', function (mapEvent) {
				const {lat,lng} = mapEvent.latlng;
				
				//add marker
				L.marker(lat, lng).addTo(map)
				.bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
				.openPopup();
		})
}, function () {
		alert('couldn\'t get your location')
		}
)	

}

showPos();
