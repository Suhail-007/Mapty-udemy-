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
    this.speed = this.distance / (this.duration / 60);
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

const btnsCont = document.querySelector('#btns');
const sortBtn = document.querySelector('[data-sortCont]');
const sortList = document.querySelector('[data-sortList]');
const deleteList = document.querySelector('[data-deleteList]');

/////////////////////////////////////////////
//APPLICATION ARCHITECTURE
class App {
  #elemId;
  #html;
  #map;
  #mapEvent;
  #marker;
  #markers;
  #workouts = [];
  #mapZoomLevel = 13;

  #editFlag = false;
  #editId;

  constructor() {

    //get position
    this._getPosition();

    //unhide sort and delete btns if workouts exist in local storage
    this._showBtns();

    //Event listeners
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToMap.bind(this));

    //Added by suhail-007@github
    //edit list item 
    containerWorkouts.addEventListener('dblclick', this._editListItem.bind(this));

    btnsCont.addEventListener('click', this._openList)
    sortList.addEventListener('click', this._getOptionType.bind(this));
    deleteList.addEventListener('click', this._getOptionType.bind(this));

    //Added by suhail-007@github   

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
      attribution: '&c; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    /*  this.#markers = L.layerGroup();
      this.#marker = L.marker(coords);
      this.#markers.addLayer(this.#marker);
      console.log(this.#marker); */


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

    //Added by suhail-007@github
    btnsCont.classList.remove('hidden');
  }

  _hideForm() {
    //clear values
    this._resetValues();

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => form.style.display = 'grid', 1000);
  }

  _toggleElevationField() {

    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');

  }

  _newWorkout(e) {
    e.preventDefault();

    if (!this.#editFlag) {
      //helper	functions	
      const validInput = (...input) => input.every(inp => Number.isFinite(inp));
      const allPositive = (...input) => input.every(inp => inp > 0);

      //get data from form		
      const type = inputType.value;
      const distance = +inputDistance.value;
      const duration = +inputDuration.value;
      const { lat, lng } = this.#mapEvent.latlng;
      let workout;

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

    } else if (this.#editFlag) {

      this.#workouts.map((work, i) => {
        if (work.id === this.#editId) {

          work.type = inputType.value;

          work.distance = inputDistance.value;
          work.duration = inputDuration.value;

          if (work.type === 'running') {
            work.cadence = inputCadence.value;
          }

          if (work.type === 'cycling') {
            work.elevationGain = inputElevation.value;
          }
        }
      })

      //overwrite local storage
      localStorage.setItem('workouts', JSON.stringify(this.#workouts));

      //reload the page
      location.reload();
    }
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords, {
        draggable: true,
      }).addTo(this.#map)
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
    
    <!----Added by suhail-007@github---->
    
      <div class="crossWrapper hidden">
        <div class="crossBtn">×</div>
      </div>
  
    <!----Added by suhail-007@github----> 
     
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${workout.type === 'running' ? '🏃' : '🚴'}</span>
        <span class="workout__value distance">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value duration">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `

    if (workout.type === 'running') {
      this.#html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value pace">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value cadence">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
    `
    }

    if (workout.type === 'cycling') {
      this.#html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value speed">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value elevation">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `
    }

    form.insertAdjacentHTML('afterend', this.#html);

    //cross delete btn
    const crossBtn = document.querySelector('.crossBtn');
    crossBtn.addEventListener('click', this._crossDeleteBtn.bind(this));
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

  _setLocalStorage() {
    return localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    //Added by suhail-007@github
    //setting prototype 
    data.forEach(item => {
      if (item.type === 'running') item.__proto__ = Running.prototype;

      if (item.type === 'cycling') item.__proto__ = Cycling.prototype;
    })

    //Added by suhail-007@github

    this.#workouts = data;
    this.#workouts.forEach(work => this._renderWorkout(work));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }

  //Added by suhail-007@github
  _resetValues() {
    inputDistance.value = inputDuration.value = inputElevation.value = inputCadence.value = '';
  }

  _getOptionType(e) {

    if (e.target.parentElement.matches('.delete-list')) {
      this.#elemId = e.target.id;
      this._deleteWorkouts(this.#elemId);
    }

    if (e.target.parentElement.matches('.sort-list')) {
      this.#elemId = e.target.id;
      this._sortWorkoutList(this.#elemId);
    }

  }

  _sortWorkoutList(elemId) {
    const formList = document.querySelectorAll('.workout');
    let sortedArr;

    if (!elemId) return

    //default order of the list
    if (elemId === 'default') sortedArr = this.#workouts.slice();

    //alphabetical order
    if (elemId === 'alphabetically') {
      sortedArr = this.#workouts.slice().sort((a, b) => {
        const nameA = a.type.toLowerCase();
        const nameB = b.type.toLowerCase();

        if (nameA > nameB) return -1;
        if (nameA < nameB) return 1;
      })
    }

    // duration in ascending order
    if (elemId === 'duration') {
      sortedArr = this.#workouts.slice().sort((a, b) => {
        if (a.duration > b.duration) return -1;
        if (a.duration < b.duration) return 1;
      })
    }

    //distance in ascending order
    if (elemId === 'distance') {
      sortedArr = this.#workouts.slice().sort((a, b) => {
        if (a.distance > b.distance) return -1;
        if (a.distance < b.distance) return 1;
      })
    }

    //render sorted array on form
    sortedArr.forEach(work => this._renderWorkout(work));

    //clear the form
    formList.forEach(li => li.style.display = li.remove());

    //hide btn as soon as user click on any sort option
    sortList.classList.add('hidden');

    //this will preserve the animation
    setTimeout(function() {
      sortList.style.display = 'flex';
    }, 500);
  }

  _showBtns() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return
    if (data.length !== 0) btnsCont.classList.remove('hidden');
  }

  _openList(e) {
    let listOptions;

    const btn = e.target.dataset.sortcont === 'sort-list' ? e.target.dataset.sortcont : e.target.dataset.deletebtn;

    if (!btn) return;

    if (btn) {
      listOptions = document.querySelector(`.${btn}`);
      listOptions.classList.toggle('hidden');
    }
  }

  _deleteWorkouts(elemId) {
    const formList = document.querySelectorAll('.workout');
    const crossBtnWrapper = document.querySelectorAll('.crossWrapper');

    if (elemId === 'delete') {

      crossBtnWrapper.forEach(btn => btn.classList.remove('hidden'));
    }

    if (elemId === 'deleteAll') {
      //clear local storage
      this.reset()
      //clear form lists
      formList.forEach(li => li.style.display = li.remove());
      btnsCont.classList.add('hidden');
    }

    deleteList.classList.add('hidden');
    this._resetValues();
  }

  _crossDeleteBtn(e) {
    const formList = Array.from(document.querySelectorAll('.workout'));
    const elem = e.target.closest('.workout').dataset.id;

    if (elem) {
      formList.forEach(li => {
        if (elem === li.dataset.id) li.remove();
      });

      this.#workouts.filter((work, i) => {
        if (work.id === elem) {
          this.#workouts.splice(i, 1);
        }
      });

      localStorage.setItem('workouts', JSON.stringify(this.#workouts));

      if (this.#workouts.length === 0) {
        this.reset();
        btnsCont.classList.add('hidden');
      }
    }

    this._resetValues();
  }

  _editListItem(e) {
    const elem = e.target.closest('.workout');
    this.#editId = elem.dataset.id;

    this.#workouts.forEach(work => {
      if (work.id === this.#editId) {

        inputType.value = work.type;
        inputDistance.value = work.distance;
        inputDuration.value = work.duration;

        if (work.type === 'running') {
          inputCadence.value = work.cadence;
          if (inputCadence.closest('.form__row').classList.contains('form__row--hidden')) this._toggleElevationField();
        }

        if (work.type === 'cycling') {
          inputElevation.value = work.elevationGain;
          this._toggleElevationField();
        }
      }
    })

    this._showForm();
    this.#editFlag = true
  }


  //Added by suhail-007@github
}