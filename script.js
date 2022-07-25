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


class App {
		//Private fields		
		#map;
		#mapEvent
		
		constructor() {
		  form.addEventListener('submit', this._showForm.bind(this));
		 
		 //using change event first time
    inputType.addEventListener('change', this._toggleElevationField)

		}
		
		_getPosition() {
		navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function () {	alert('couldn\'t get your location')})
		}
		
		_loadMap(position) {
			//get Coordinates
				const {latitude} = position.coords;
				const {longitude} = position.coords;
				const coords = [latitude, longitude];
		
	 			this.#map = L.map('map').setView(coords, 13);
						L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);   
    
  		//click event on map
				this.#map.on('click', function (mapE) {
				this.#mapEvent = mapE;
				form.classList.remove('hidden');
				inputDistance.focus()
				});
		}
		
		_showForm(e) {
		  e.preventDefault()		
		
		//clear Input fields
		inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
		
		const {lat,lng} = this.#mapEvent.latlng;
		//add marker				
		L.marker([lat, lng])
		.addTo(this.#map)
		.bindPopup(L.popup({
			maxWidth: 250,
			minWidth: 100,
			autoClose: false,
			closeOnClick: false,
			className: 'running-popup',
		})
		).setPopupContent('Work')
		.openPopup();	
		}
		
		_toggleElevationField() { inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
		  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
		}
		
}

const app = new App();

app._getPosition();
