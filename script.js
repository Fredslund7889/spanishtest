// script.js
class SpanishLearningApp {
  constructor() {
    this.exercises = [];
    this.currentExercise = null;
    this.stats = {
      correct: 0,
      total: 0,
    };

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    document
      .getElementById("loadFile")
      .addEventListener("click", () => this.loadExcelFile());
    document
      .getElementById("checkAnswer")
      .addEventListener("click", () => this.checkAnswer());
    document
      .getElementById("nextQuestion")
      .addEventListener("click", () => this.nextQuestion());

    // Allow Enter key to submit answer
    document
      .getElementById("spanishInput")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.checkAnswer();
        }
      });
  }

  loadExcelFile() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if (!file) {
      alert("Please select an Excel file first!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        this.parseExercises(jsonData);
        this.startPractice();
      } catch (error) {
        alert(
          "Error reading Excel file. Please make sure it's a valid Excel file."
        );
        console.error("Error:", error);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  parseExercises(data) {
    this.exercises = [];

    // Skip header row if it exists
    const startRow =
      data[0] &&
      typeof data[0][0] === "string" &&
      data[0][0].toLowerCase().includes("english")
        ? 1
        : 0;

    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (row && row[0] && row[1]) {
        // Must have English and at least one Spanish translation
        const exercise = {
          english: row[0].trim(),
          spanish: [
            row[1] ? row[1].trim() : null,
            row[2] ? row[2].trim() : null,
            row[3] ? row[3].trim() : null,
          ].filter((translation) => translation !== null && translation !== ""),
          tip: row[4] ? row[4].trim() : null,
        };

        if (exercise.spanish.length > 0) {
          this.exercises.push(exercise);
        }
      }
    }

    if (this.exercises.length === 0) {
      alert(
        "No valid exercises found in the Excel file. Please check the format."
      );
      return;
    }

    console.log(`Loaded ${this.exercises.length} exercises`);
  }

  startPractice() {
    document.getElementById("uploadSection").style.display = "none";
    document.getElementById("practiceSection").style.display = "block";
    this.nextQuestion();
  }

  nextQuestion() {
    if (this.exercises.length === 0) {
      alert("No exercises available!");
      return;
    }

    // Select a random exercise
    const randomIndex = Math.floor(Math.random() * this.exercises.length);
    this.currentExercise = this.exercises[randomIndex];

    // Display the English sentence
    document.getElementById("englishText").textContent =
      this.currentExercise.english;

    // Clear previous input and results
    document.getElementById("spanishInput").value = "";
    document.getElementById("resultSection").style.display = "none";
    document.getElementById("spanishInput").focus();

    this.updateStats();
  }

  checkAnswer() {
    const userAnswer = document.getElementById("spanishInput").value.trim();

    if (!userAnswer) {
      alert("Please enter a translation first!");
      return;
    }

    // Check if the answer is correct
    const isCorrect = this.isAnswerCorrect(
      userAnswer,
      this.currentExercise.spanish
    );

    // Update stats
    this.stats.total++;
    if (isCorrect) {
      this.stats.correct++;
    }

    // Display results
    this.displayResults(isCorrect);
    this.updateStats();
  }

  isAnswerCorrect(userAnswer, correctAnswers) {
    const normalizedUserAnswer = this.normalizeText(userAnswer);

    return correctAnswers.some((correct) => {
      const normalizedCorrect = this.normalizeText(correct);
      return normalizedUserAnswer === normalizedCorrect;
    });
  }

  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[áàäâ]/g, "a")
      .replace(/[éèëê]/g, "e")
      .replace(/[íìïî]/g, "i")
      .replace(/[óòöô]/g, "o")
      .replace(/[úùüû]/g, "u")
      .replace(/[ñ]/g, "n")
      .replace(/[ç]/g, "c")
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .replace(/\s+/g, " ") // Normalize spaces
      .trim();
  }

  displayResults(isCorrect) {
    const resultSection = document.getElementById("resultSection");
    const feedback = document.getElementById("feedback");
    const correctAnswers = document.getElementById("correctAnswers");
    const tip = document.getElementById("tip");

    // Show feedback
    feedback.textContent = isCorrect
      ? "¡Correcto! Well done!"
      : "¡Incorrecto! Try again next time.";
    feedback.className = `feedback ${isCorrect ? "correct" : "incorrect"}`;

    // Show correct answers
    correctAnswers.innerHTML = "";
    this.currentExercise.spanish.forEach((answer) => {
      const li = document.createElement("li");
      li.textContent = answer;
      correctAnswers.appendChild(li);
    });

    // Show tip if available
    if (this.currentExercise.tip) {
      tip.textContent = this.currentExercise.tip;
      tip.style.display = "block";
    } else {
      tip.style.display = "none";
    }

    resultSection.style.display = "block";
  }

  updateStats() {
    document.getElementById("correctCount").textContent = this.stats.correct;
    document.getElementById("totalCount").textContent = this.stats.total;

    const accuracy =
      this.stats.total > 0
        ? Math.round((this.stats.correct / this.stats.total) * 100)
        : 0;
    document.getElementById("accuracy").textContent = accuracy + "%";
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SpanishLearningApp();
});
