'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);


  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // km
    this.duration = duration; // min
    this.clicks = 0;
  }

  _setDescription() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${this.months[this.date.getMonth()]} ${this.date.getDate()}`
  }

  click() {
    return this.clicks++
  }
}

class Running extends Workout {
  type = 'running'
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km		
    this.pace = this.distance / this.duration;
    return this.pace
  }
}

class Cycling extends Workout {
  type = 'cycling'
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //	km/h
    this.speed = this.duration / (this.distance / 60);
    return this.speed
  }
}

//const run = new Running([21, -16], 20, 234)
//console.log(run)

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const sortWrapper = document.querySelector('[data-sortWrapper]');
const sortBtn = document.querySelector('[data-sortCont]');
const sortList = document.querySelector('[data-sortList]');
/////////////////////////////////////////////
//APPLICATION ARCHITECTURE
class App {
  #elemId;
  #html;
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;
  constructor() {

    //get position
    this._getPosition();

    //unhide sort btn if workouts exist in local storage
    this._showSortBtn();

    //Event listeners
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToMap.bind(this));
    sortBtn.addEventListener('click', this._showSortOptions);
    sortList.addEventListener('click', this._getSortType.bind(this));

    //get workout from local storage
    this._getLocalStorage();
  }

  _getPosition() {
    if (navigator.geolocation) {
      //get Coordinates
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
        alert('couldn\'t get your location')
      })
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    //click event on map
    this.#map.on('click', this._showForm.bind(this));

    //render marker from localStorage
    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;

    //remove class	
    form.classList.remove('hidden');
    inputDistance.focus();

    sortWrapper.classList.remove('hidden');
  }
  
  _hideForm() {
    inputDistance.value = inputDuration.value = inputElevation.value = inputCadence.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => form.style.display = 'grid', 1000);
  }

  _showSortBtn() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return
    if (data.length !== 0) sortWrapper.classList.remove('hidden');
  }

  _showSortOptions(e) {
    const sort = e.target.classList.contains('sort-cont');

    if (sort) sortList.classList.toggle('hidden');
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    //helper	functions	
    const validInput = (...input) => input.every(inp => Number.isFinite(inp));
    const allPositive = (...input) => input.every(inp => inp > 0);

    //get data from form		
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    e.preventDefault();

    //if workout running, create running obj		
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //check if data is valid		
      if (!validInput(distance, duration, cadence) || !allPositive(distance, duration, cadence)) return alert('input have to be positive numbers');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if workout cycling, create cycling obj		
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //check if data is valid		
      if (!validInput(distance, duration, elevation) || !allPositive(distance, duration)) return alert('distance and duration have to be positive numbers');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }


    //add new object to workout arrray;
    this.#workouts.push(workout);

    //Render workout as an marker on map		
    this._renderWorkoutMarker(workout);

    //Render workout as a list
    this._renderWorkout(workout);

    //Hide the form + clear the input fields		
    this._hideForm();

    //set local storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords).addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 200,
        minWidth: 50,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
      })).setPopupContent(`${workout.type === 'running' ? '🏃' : '🚴'} ${workout.description}`)
      .openPopup();

  }

  _renderWorkout(workout) {
    this.#html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃' : '🚴'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `

    if (workout.type === 'running') {
      this.#html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
    `
    }

    if (workout.type === 'cycling') {
      this.#html += `
       <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `
    }

    form.insertAdjacentHTML('afterend', this.#html);
  }

  _moveToMap(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return

    const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);



    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1
      }
    })
    //    workout.click();
  }

  _getSortType(e) {
    this.#elemId = e.target.id;
    this._sortWorkoutList(this.#elemId);
  }
  
  _sortWorkoutList(elemId) {
    let sortedArr;
    const formList = document.querySelectorAll('.workout');
    
    if(!elemId) return
    
    if (elemId === 'default') sortedArr = this.#workouts.slice();
    
    if (elemId === 'alphabetically') {
      sortedArr = this.#workouts.slice().sort((a, b) => {
        const nameA = a.type.toLowerCase();
        const nameB = b.type.toLowerCase();
        
        if (nameA > nameB) return -1;
        if(nameA < nameB) return 1;
      })
    }
    
    if (elemId === 'duration') {
      sortedArr = this.#workouts.slice().sort((a, b) => {
        if (a.duration > b.duration) return -1;
        if(a.duration < b.duration) return 1;
      })
    }
    
    if (elemId === 'distance') {
      sortedArr = this.#workouts.slice().sort((a, b) => {
        if (a.distance > b.distance) return -1;
        if(a.distance < b.distance) return 1;
      })
    } 
    
    //clear the form
    formList.forEach(li => li.style.display = li.remove());
    
    //render sorted array on form
    sortedArr.forEach(work => this._renderWorkout(work));
    
    //hide btn as soon as user click on any sort option 
    sortList.classList.add('hidden');
    setTimeout(function () {
      sortList.style.display = 'flex';
    }, 500);
    
    console.log(sortedArr);
  }
  
_setLocalStorage() {
  localStorage.setItem('workouts', JSON.stringify(this.#workouts));
}

_getLocalStorage() {
  const data = JSON.parse(localStorage.getItem('workouts'));

  if (!data) return;

  this.#workouts = data;

  this.#workouts.forEach(work => this._renderWorkout(work));
}

reset() {
  localStorage.removeItem('workouts');
}
}

//class instance
const app = new App();
