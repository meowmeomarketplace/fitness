let routines = JSON.parse(localStorage.getItem('routines')) || {}; 

const routineSelect = document.getElementById('routine-select');
const restInput = document.getElementById('rest-time');
const currentExerciseDisplay = document.getElementById('current-exercise');
const timerDisplay = document.getElementById('timer');
const nextExerciseDisplay = document.getElementById('next-exercise');
const progressBar = document.getElementById('progress-bar');

const startResumeBtn = document.getElementById('start-resume-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

const beep = document.getElementById('beep-sound');

let timerInterval = null;
let isPaused = false;
let secondsLeft = 0;

let currentRoutine = null;
let currentExerciseIndex = 0;
let inRest = false;
let restDuration = 0;

let totalSets = 1;
let currentSet = 1;
let setRestDuration = 0;

function loadRoutines() {
  routineSelect.innerHTML = "";
  Object.keys(routines).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    routineSelect.appendChild(opt);
  });
}
loadRoutines();

function addExercise() {
  const container = document.createElement('div');
  container.className = 'exercise-item';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'exercise-name';
  nameInput.placeholder = 'Exercise Name';

  const label = document.createElement('label');
  label.textContent = "Duration (seconds):";

  const durationInput = document.createElement('input');
  durationInput.type = 'number';
  durationInput.className = 'exercise-duration';
  durationInput.value = 30;
  durationInput.min = 1;

  container.appendChild(nameInput);
  container.appendChild(label);
  container.appendChild(durationInput);

  document.getElementById('exercise-list').appendChild(container);
}

function saveRoutine() {
  const name = document.getElementById('routine-name').value.trim();
  if (!name) return alert("Enter a routine name!");

  const items = [...document.querySelectorAll('.exercise-item')];
  const exercises = items.map(item => {
    const exerciseName = item.querySelector('.exercise-name').value.trim();
    const duration = parseInt(item.querySelector('.exercise-duration').value);
    return exerciseName && duration && duration > 0 ? { name: exerciseName, duration } : null;
  }).filter(Boolean);

  if (exercises.length === 0) return alert("Add at least one valid exercise!");

  const sets = parseInt(document.getElementById('set-count').value) || 1;
  const setRest = parseInt(document.getElementById('set-rest').value) || 0;

  routines[name] = { exercises, sets, setRest };
  localStorage.setItem('routines', JSON.stringify(routines));
  loadRoutines();
  alert("Routine saved!");
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerDisplay(originalDuration) {
  timerDisplay.textContent = format
