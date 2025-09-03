let routine = [];
let currentIndex = 0;
let timer;
let timeLeft;
let isRunning = false;
let sets = 1;
let currentSet = 1;
let restBetweenSets = 0;
let restBetweenExercises = 0;
let inRest = false;

const currentExerciseEl = document.getElementById("current-exercise");
const nextExerciseEl = document.getElementById("next-exercise");
const timerEl = document.getElementById("timer");
const progressBar = document.getElementById("progress-bar");
const setInfoEl = document.getElementById("set-info");

// Start routine
function startRoutine() {
  if (routine.length === 0) return;
  currentIndex = 0;
  currentSet = 1;
  isRunning = true;
  startExercise();
}

// Start an exercise
function startExercise() {
  inRest = false;
  const exercise = routine[currentIndex];
  timeLeft = exercise.duration;
  updateDisplay();

  timer = setInterval(() => {
    timeLeft--;
    updateDisplay();
    if (timeLeft <= 0) {
      clearInterval(timer);
      handleNext();
    }
  }, 1000);
}

// Handle transition
function handleNext() {
  if (currentIndex < routine.length - 1) {
    // go to rest between exercises
    startRest(false);
  } else if (currentSet < sets) {
    // finished a set → rest between sets
    startRest(true);
  } else {
    finishRoutine();
  }
}

// Start rest
function startRest(isSetRest) {
  inRest = true;
  timeLeft = isSetRest ? restBetweenSets : restBetweenExercises;
  updateDisplay();

  timer = setInterval(() => {
    timeLeft--;
    updateDisplay();
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (isSetRest) {
        currentSet++;
        currentIndex = 0;
      } else {
        currentIndex++;
      }
      startExercise();
    }
  }, 1000);
}

// Update UI
function updateDisplay() {
  if (inRest) {
    currentExerciseEl.textContent = "Rest";
    // show only next exercise
    const next =
      currentIndex < routine.length - 1
        ? routine[currentIndex + 1].name
        : currentSet < sets
        ? routine[0].name
        : "";
    nextExerciseEl.textContent = next ? `Next: ${next}` : "";
  } else {
    currentExerciseEl.textContent = routine[currentIndex].name;
    const next =
      currentIndex < routine.length - 1
        ? routine[currentIndex + 1].name
        : currentSet < sets
        ? routine[0].name
        : "";
    nextExerciseEl.textContent = next ? `Next: ${next}` : "";
  }

  timerEl.textContent = formatTime(timeLeft);
  progressBar.style.width = `${
    ((routine[currentIndex]?.duration - timeLeft) /
      routine[currentIndex]?.duration) *
    100
  }%`;
  setInfoEl.textContent = `Set ${currentSet} of ${sets}`;
}

// Finish routine
function finishRoutine() {
  isRunning = false;
  currentExerciseEl.textContent = "Done!";
  nextExerciseEl.textContent = "";
  timerEl.textContent = "";
  progressBar.style.width = "0%";
}

// Format time
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Save routine
document.getElementById("save-routine").addEventListener("click", () => {
  const routineName = document.getElementById("routine-name").value.trim();
  if (!routineName) return alert("Please enter a routine name.");

  sets = parseInt(document.getElementById("sets").value) || 1;
  restBetweenSets =
    parseInt(document.getElementById("rest-between-sets").value) || 0;
  restBetweenExercises =
    parseInt(document.getElementById("rest-between-exercises").value) || 0;

  const exercises = [];
  document.querySelectorAll(".exercise-item").forEach((item) => {
    const name = item.querySelector(".exercise-name").value.trim();
    const duration =
      parseInt(item.querySelector(".exercise-duration").value) || 0;
    if (name && duration > 0) {
      exercises.push({ name, duration });
    }
  });

  if (exercises.length === 0) return alert("Add at least one exercise.");

  const routines = JSON.parse(localStorage.getItem("routines")) || {};
  routines[routineName] = {
    exercises,
    sets,
    restBetweenSets,
    restBetweenExercises,
  };
  localStorage.setItem("routines", JSON.stringify(routines));

  alert("Routine saved!");
});

// Delete exercise button (small black ×)
function createDeleteButton() {
  const btn = document.createElement("button");
  btn.textContent = "×";
  btn.style.color = "black";
  btn.style.fontSize = "1rem";
  btn.style.background = "none";
  btn.style.border = "none";
  btn.style.cursor = "pointer";
  btn.addEventListener("click", function () {
    this.parentElement.remove();
  });
  return btn;
}
