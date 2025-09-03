let routines = JSON.parse(localStorage.getItem("routines")) || [];
let currentRoutine = null;
let currentExerciseIndex = 0;
let timerInterval = null;
let remainingTime = 0;
let inRest = false;
let currentSet = 1;

function startOrResumeRoutine() {
  if (!currentRoutine) {
    alert("Please select a routine first!");
    return;
  }
  document.getElementById("start-resume-btn").disabled = true;
  document.getElementById("pause-btn").disabled = false;

  if (remainingTime <= 0) {
    startExercise();
  } else {
    resumeTimer();
  }
}

function pauseRoutine() {
  clearInterval(timerInterval);
  document.getElementById("pause-btn").disabled = true;
  document.getElementById("start-resume-btn").disabled = false;
}

function resetRoutine() {
  clearInterval(timerInterval);
  currentExerciseIndex = 0;
  currentSet = 1;
  inRest = false;
  remainingTime = 0;
  document.getElementById("timer").textContent = "00:00";
  document.getElementById("progress-bar").style.width = "0";
  document.getElementById("current-exercise").textContent = "";
  document.getElementById("next-exercise").textContent = "";
  document.getElementById("set-info").textContent = "";
  document.getElementById("pause-btn").disabled = true;
  document.getElementById("start-resume-btn").disabled = false;
}

function startExercise() {
  if (currentExerciseIndex >= currentRoutine.exercises.length) {
    if (currentSet < currentRoutine.sets) {
      currentSet++;
      currentExerciseIndex = 0;
      inRest = true;
      remainingTime = currentRoutine.setRest;
      updateExerciseDisplay();
      startTimer();
    } else {
      resetRoutine();
      alert("Routine Complete!");
    }
    return;
  }

  inRest = false;
  remainingTime = currentRoutine.exercises[currentExerciseIndex].duration;
  updateExerciseDisplay();
  startTimer();
}

function startRest() {
  inRest = true;
  remainingTime = currentRoutine.exerciseRest;
  updateExerciseDisplay();
  startTimer();
}

function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    remainingTime--;
    updateTimerDisplay();

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      if (inRest) {
        inRest = false;
        currentExerciseIndex++;
        startExercise();
      } else {
        if (currentExerciseIndex < currentRoutine.exercises.length - 1) {
          startRest();
        } else {
          currentExerciseIndex++;
          startExercise();
        }
      }
    }
  }, 1000);
}

function resumeTimer() {
  startTimer();
}

function updateTimerDisplay() {
  const minutes = String(Math.floor(remainingTime / 60)).padStart(2, "0");
  const seconds = String(remainingTime % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${minutes}:${seconds}`;

  const total = inRest
    ? currentRoutine.exerciseRest
    : currentRoutine.exercises[currentExerciseIndex].duration;
  const progress = ((total - remainingTime) / total) * 100;
  document.getElementById("progress-bar").style.width = `${progress}%`;
}

function updateExerciseDisplay() {
  document.getElementById("set-info").textContent =
    `Set ${currentSet} of ${currentRoutine.sets}`;

  if (inRest) {
    document.getElementById("current-exercise").textContent = "Rest";
    if (currentExerciseIndex < currentRoutine.exercises.length) {
      document.getElementById("next-exercise").textContent =
        `Next: ${currentRoutine.exercises[currentExerciseIndex].name}`;
    } else {
      document.getElementById("next-exercise").textContent = "";
    }
  } else {
    document.getElementById("current-exercise").textContent =
      currentRoutine.exercises[currentExerciseIndex].name;
    if (currentExerciseIndex < currentRoutine.exercises.length - 1) {
      document.getElementById("next-exercise").textContent =
        `Next: ${currentRoutine.exercises[currentExerciseIndex + 1].name}`;
    } else {
      document.getElementById("next-exercise").textContent = "";
    }
  }
}

function addExercise() {
  const exerciseList = document.getElementById("exercise-list");
  const div = document.createElement("div");
  div.className = "exercise-item";
  div.innerHTML = `
    <input type="text" class="exercise-name" placeholder="Exercise Name" />
    <label>Duration (seconds):</label>
    <input type="number" class="exercise-duration" value="30" min="1" />
    <button type="button" class="delete-btn" onclick="this.parentElement.remove()">×</button>
  `;
  exerciseList.appendChild(div);
}

function saveRoutine() {
  const name = document.getElementById("routine-name").value.trim();
  const sets = parseInt(document.getElementById("set-count").value) || 1;
  const setRest = parseInt(document.getElementById("set-rest").value) || 0;
  const exerciseRest = parseInt(document.getElementById("exercise-rest").value) || 0;

  if (!name) {
    alert("Please enter a routine name");
    return;
  }

  const exercises = Array.from(document.querySelectorAll(".exercise-item")).map(
    (item) => ({
      name: item.querySelector(".exercise-name").value.trim(),
      duration: parseInt(item.querySelector(".exercise-duration").value) || 30,
    })
  );

  const routine = { name, sets, setRest, exerciseRest, exercises };
  const existingIndex = routines.findIndex((r) => r.name === name);

  if (existingIndex >= 0) {
    routines[existingIndex] = routine;
  } else {
    routines.push(routine);
  }

  localStorage.setItem("routines", JSON.stringify(routines));
  loadRoutineOptions();
  document.getElementById("save-feedback").textContent = "Routine saved!";
  setTimeout(() => {
    document.getElementById("save-feedback").textContent = "";
  }, 2000);
}

function loadRoutineOptions() {
  const select = document.getElementById("routine-select");
  select.innerHTML = "";
  routines.forEach((routine, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = routine.name;
    select.appendChild(option);
  });
}

function deleteRoutine() {
  const select = document.getElementById("routine-select");
  const index = select.value;
  if (index !== "" && confirm("Delete this routine?")) {
    routines.splice(index, 1);
    localStorage.setItem("routines", JSON.stringify(routines));
    loadRoutineOptions();
    resetRoutine();
  }
}

document.getElementById("routine-select").addEventListener("change", (e) => {
  currentRoutine = routines[e.target.value];
  resetRoutine();
});

window.onload = loadRoutineOptions;
