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
  timerDisplay.textContent = formatTime(secondsLeft);
  const percent = ((originalDuration - secondsLeft) / originalDuration) * 100;
  progressBar.style.width = `${percent}%`;
}

function countdownStep(duration, label, callback) {
  secondsLeft = duration;
  updateTimerDisplay(duration);
  currentExerciseDisplay.textContent = label;

  timerInterval = setInterval(() => {
    if (!isPaused) {
      secondsLeft--;
      if (secondsLeft > 0 && secondsLeft <= 3) {
        try { beep.currentTime = 0; beep.play(); } catch (e) {}
      }
      updateTimerDisplay(duration);
      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        callback();
      }
    }
  }, 1000);
}

function startOrResumeRoutine() {
  if (isPaused && currentRoutine) {
    isPaused = false;
    pauseBtn.disabled = false;
    startResumeBtn.disabled = true;
    return;
  }

  const selected = routineSelect.value;
  if (!selected) return alert("Select a routine!");

  const routineObj = routines[selected];
  if (!routineObj || !routineObj.exercises || routineObj.exercises.length === 0)
    return alert("Routine has no exercises!");

  currentRoutine = routineObj;
  restDuration = parseInt(restInput.value) || 0;
  totalSets = currentRoutine.sets || 1;
  setRestDuration = currentRoutine.setRest || 0;

  currentExerciseIndex = 0;
  currentSet = 1;
  inRest = false;
  isPaused = false;

  startResumeBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;

  runNextStep();
}

function runNextStep() {
  if (!currentRoutine) return resetRoutine();

  const exercises = currentRoutine.exercises;

  if (currentExerciseIndex >= exercises.length) {
    if (currentSet < totalSets) {
      currentSet++;
      currentExerciseIndex = 0;
      inRest = false;
      runNextStep();
      return;
    } else {
      currentExerciseDisplay.textContent = "Done!";
      timerDisplay.textContent = "00:00";
      progressBar.style.width = '100%';
      progressBar.style.backgroundColor = '#28a745';
      startResumeBtn.disabled = false;
      startResumeBtn.innerHTML = "&#9654;";
      pauseBtn.disabled = true;
      resetBtn.disabled = true;
      currentRoutine = null;
      nextExerciseDisplay.textContent = "";
      return;
    }
  }

  const ex = exercises[currentExerciseIndex];

  if (inRest && restDuration > 0) {
    progressBar.style.backgroundColor = '#ffc107';
    const nextEx = exercises[currentExerciseIndex];
    nextExerciseDisplay.textContent = "Next: " + (nextEx ? nextEx.name : "");
    countdownStep(restDuration, "Rest", () => {
      inRest = false;
      runNextStep();
    });
  } else {
    let label = "";
    if (totalSets > 1) label += `Set ${currentSet}\n`;
    label += ex.name;

    currentExerciseDisplay.textContent = label;

    const nextEx = exercises[currentExerciseIndex + 1];
    nextExerciseDisplay.textContent = nextEx ? "Next: " + nextEx.name : "";

    progressBar.style.backgroundColor = '#28a745';
    countdownStep(ex.duration, ex.name, () => {
      inRest = true;
      currentExerciseIndex++;
      runNextStep();
    });
  }
}

function pauseRoutine() {
  if (!timerInterval) return;
  isPaused = true;
  pauseBtn.disabled = true;
  startResumeBtn.disabled = false;
  startResumeBtn.innerHTML = "&#9654;";
}

function resetRoutine() {
  clearInterval(timerInterval);
  timerInterval = null;
  currentRoutine = null;
  currentExerciseIndex = 0;
  currentSet = 1;
  inRest = false;
  isPaused = false;

  timerDisplay.textContent = "00:00";
  currentExerciseDisplay.textContent = "";
  nextExerciseDisplay.textContent = "";
  progressBar.style.width = '0%';
  progressBar.style.backgroundColor = '#28a745';

  startResumeBtn.disabled = false;
  startResumeBtn.innerHTML = "&#9654;";
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
}

function deleteRoutine() {
  const selected = routineSelect.value;
  if (!selected) return alert("Select a routine to delete!");
  if (!confirm(`Delete routine "${selected}"?`)) return;

  delete routines[selected];
  localStorage.setItem('routines', JSON.stringify(routines));
  loadRoutines();
  resetRoutine();
}

if (document.querySelectorAll('.exercise-item').length === 0) addExercise();
