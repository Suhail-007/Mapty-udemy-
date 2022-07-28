'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class Workout {
		date = new Date();
		id = (Date.now() + '').slice(-10);
		
		constructor(coords, distance, duration) {
				this.coords = coords;
				this.distance = distance; // km
				this.duration = duration; // min
		}
}

class Running extends Workout {
		constructor(coords, distance, duration, cadence) {
				super(coords, distance, duration);
				this.cadence = cadence;
				this.calcPace();
		}
		
		calcPace() {
				// min/km		
				this.pace = this.distance / this. duration;
				return this.pace
		}
}

class Cycling extends Workout {
		constructor(coords, distance, duration, elevationGain) {
				super(coords, distance, duration);
				this.elevationGain = elevationGain;
				this.calcSpeed();
		}
		
		calcSpeed() {
			//	km/h
				this.speed = this.duration / (this.distance / 60);
				return this.speed
		}
}

//const run = new Running ([21, -16], 20, 234)
//console.log(run)



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');



/////////////////////////////////////////////
//APPLICATION ARCHITECTURE
class App {
		#map;
		#mapEvent;
		constructor() {
				this._getPosition();
				form.addEventListener('submit', this._newWorkout.bind(this));

inputType.addEventListener('change', this._toggleElevationField)

		}
		
		_getPosition() {
				if (navigator.geolocation) {
						//get Coordinates
						navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
		alert('couldn\'t get your location')
		})	
				}
		}
		
		_loadMap(position) {
		const {latitude} = position.coords;
		const {longitude} = position.coords;
		const coords = [latitude, longitude];
		this.#map = L.map('map').setView(coords, 13);
		L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(this.#map);
				//click event on map
				this.#map.on('click', this._showForm.bind(this))
		}
		
		_showForm(mapE) {
					this.#mapEvent = mapE;
					//remove class	
					form.classList.remove('hidden');
					inputDistance.focus();
		}
		
		_toggleElevationField() {
				inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
				inputElevation.closest('.form__row').classList.toggle('form__row--hidden');	
		}
		
		_newWorkout(e) {
			//helper	functions	
			const validInput = (...input) => input.every(inp => Number.isFinite(inp));
			const allPositive = (...input)	=> input.every(inp => inp > 0)	;
				
					
			//get data from form		
			const type = inputType.value;
			const distance = +inputDistance.value;
			const duration = +inputDuration.value;
			
	
			//if workout running, create running obj		
			if (type === 'running') {
						const cadence = +inputCadence.value;
						
							//check if data is valid		
							if (!validInput(distance, duration, cadence) || !allPositive(distance, duration, cadence)) return alert('input have to be positive numbers');
			}
			
			//if workout cycling, create cycling obj		
						if (type === 'cycling') {
						const elevation = +inputElevation.value;
						
							//check if data is valid		
							if (!validInput(distance, duration, elevation) || !allPositive(distance, duration)) return alert('distance and duration have to be positive numbers');
			}
			
			//add new object to workout arrray;
			
			//Render workout as an marker on map		
			
			//Render workout as a list

			//Hide the form + clear the input fields		
			
			
			
			
			
			
			e.preventDefault();
		 //add marker
		 const {lat,lng} = this.#mapEvent.latlng;
		 L.marker([lat, lng]).addTo(this.#map)
		 .bindPopup(L.popup({
		 			maxWidth: 200,
		 			minWidth: 50,
		 			autoClose: false,
		 			closeOnClick: false,
		 			className: 'running-popup',
			})
				).setPopupContent('Workout')
				.openPopup();
				
				inputDistance.value = inputDuration.value = inputElevation.value = inputCadence.value = '';
				inputElevation.blur();
				inputCadence.blur();
				}
}

//class instance
const app = new App()
