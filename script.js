// script.js
class SpanishLearningApp {
  constructor() {
    this.exercises = [];
    this.filteredExercises = [];
    this.currentExercise = null;
    this.isAnswerChecked = false;
    this.stats = { correct: 0, total: 0 };
    this.selectedDifficulty = null;
    this.selectedTheme = "";
    this.selectedSubtheme = "";

    this.initializeEventListeners();
    this.loadExercisesFromExcel();
  }

  initializeEventListeners() {
    document
      .getElementById("actionButton")
      .addEventListener("click", () => this.handleButtonClick());

    document
      .getElementById("spanishInput")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.handleButtonClick();
        }
      });

    // Difficulty buttons
    document.querySelectorAll(".btn-difficulty").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.selectedDifficulty = btn.getAttribute("data-diff");
        document
          .querySelectorAll(".btn-difficulty")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.applyFilters();
      });
    });

    // Theme select
    document.getElementById("themeSelect").addEventListener("change", (e) => {
      this.selectedTheme = e.target.value;
      this.populateSubthemes();
      this.applyFilters();
    });

    // Subtheme select
    document
      .getElementById("subthemeSelect")
      .addEventListener("change", (e) => {
        this.selectedSubtheme = e.target.value;
        this.applyFilters();
      });
  }

  loadExercisesFromExcel() {
    // Make sure SheetJS is included in your HTML:
    // <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>
    fetch("english_spanish_translations.xlsx")
      .then((response) => response.arrayBuffer())
      .then((data) => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        this.parseExercises(json);
        this.startPractice();
      })
      .catch((err) => {
        alert("Failed to load questions from Excel file.");
        console.error(err);
      });
  }

  handleButtonClick() {
    if (this.isAnswerChecked) {
      // Button is in "Next Question" mode
      this.nextQuestion();
    } else {
      // Button is in "Check Answer" mode
      this.checkAnswer();
    }
  }

  parseExercises(data) {
    this.exercises = [];

    const startRow =
      data[0] &&
      typeof data[0][0] === "string" &&
      data[0][0].toLowerCase().includes("english")
        ? 1
        : 0;

    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (row && row[0] && row[1]) {
        const exercise = {
          english: row[0]?.trim(),
          spanish: [
            row[1] ? row[1].trim() : null,
            row[2] ? row[2].trim() : null,
            row[3] ? row[3].trim() : null,
          ].filter((translation) => translation !== null && translation !== ""),
          tip: row[4] ? row[4].trim() : null,
          theme: row[5] ? row[5].trim() : "",
          subtheme: row[6] ? row[6].trim() : "",
          difficulty: row[7] ? row[7].trim().toUpperCase() : "",
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

    this.populateThemes();
    this.applyFilters();
  }

  // Populate theme dropdown
  populateThemes() {
    const themeSelect = document.getElementById("themeSelect");
    const themes = Array.from(
      new Set(this.exercises.map((ex) => ex.theme).filter(Boolean))
    );
    themeSelect.innerHTML =
      `<option value="">All Themes</option>` +
      themes
        .map((theme) => `<option value="${theme}">${theme}</option>`)
        .join("");
    this.selectedTheme = "";
    this.populateSubthemes();
  }

  // Populate subtheme dropdown based on selected theme
  populateSubthemes() {
    const subthemeSelect = document.getElementById("subthemeSelect");
    let filtered = this.exercises;
    if (this.selectedTheme) {
      filtered = filtered.filter((ex) => ex.theme === this.selectedTheme);
    }
    const subthemes = Array.from(
      new Set(filtered.map((ex) => ex.subtheme).filter(Boolean))
    );
    subthemeSelect.innerHTML =
      `<option value="">All Subthemes</option>` +
      subthemes.map((st) => `<option value="${st}">${st}</option>`).join("");
    this.selectedSubtheme = "";
  }

  // Filter exercises based on difficulty, theme, subtheme
  applyFilters() {
    this.filteredExercises = this.exercises.filter((ex) => {
      const diffMatch = this.selectedDifficulty
        ? ex.difficulty === this.selectedDifficulty
        : true;
      const themeMatch = this.selectedTheme
        ? ex.theme === this.selectedTheme
        : true;
      const subthemeMatch = this.selectedSubtheme
        ? ex.subtheme === this.selectedSubtheme
        : true;
      return diffMatch && themeMatch && subthemeMatch;
    });

    if (this.filteredExercises.length === 0) {
      document.getElementById("practiceSection").style.display = "none";
      document.getElementById("statsSection").style.display = "none";
      document.getElementById("loadingSection").style.display = "block";
      document
        .getElementById("loadingSection")
        .querySelector("h3").textContent = "No exercises match your filters.";
      return;
    } else {
      document.getElementById("loadingSection").style.display = "none";
      document.getElementById("practiceSection").style.display = "block";
      document.getElementById("statsSection").style.display = "block";
      this.nextQuestion();
    }
  }

  startPractice() {
    document.getElementById("loadingSection").style.display = "none";
    document.getElementById("practiceSection").style.display = "block";
    document.getElementById("statsSection").style.display = "block";
    this.nextQuestion();
  }

  nextQuestion() {
    if (this.filteredExercises.length === 0) {
      alert("No exercises available for the selected filters!");
      return;
    }
    const randomIndex = Math.floor(
      Math.random() * this.filteredExercises.length
    );
    this.currentExercise = this.filteredExercises[randomIndex];

    // Display the English sentence
    document.getElementById("englishText").textContent =
      this.currentExercise.english;

    // Clear previous input and results
    document.getElementById("spanishInput").value = "";
    document.getElementById("resultSection").style.display = "none";
    document.getElementById("spanishInput").focus();

    // Reset button to "Check Answer" mode
    this.isAnswerChecked = false;
    this.updateButtonState();

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

    // Switch button to "Next Question" mode
    this.isAnswerChecked = true;
    this.updateButtonState();

    this.updateStats();
  }

  updateButtonState() {
    const button = document.getElementById("actionButton");
    if (this.isAnswerChecked) {
      button.innerHTML =
        '<i class="bi bi-arrow-right-circle"></i> Next Question';
      button.className = "btn btn-success btn-lg px-4";
    } else {
      button.innerHTML = '<i class="bi bi-check-circle"></i> Check Answer';
      button.className = "btn btn-primary btn-lg px-4";
    }
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
    const tipContent = document.getElementById("tipContent");

    // Show feedback with Bootstrap alert classes
    feedback.innerHTML = `<i class="bi bi-${
      isCorrect ? "check-circle-fill" : "x-circle-fill"
    }"></i> 
                             ${
                               isCorrect
                                 ? "¡Correcto! Well done!"
                                 : "¡Incorrecto! Try again next time."
                             }`;
    feedback.className = `alert ${
      isCorrect ? "alert-success correct" : "alert-danger incorrect"
    } text-center fw-bold`;

    // Show correct answers as Bootstrap list group
    correctAnswers.innerHTML = "";
    this.currentExercise.spanish.forEach((answer) => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.innerHTML = `<i class="bi bi-check-circle text-success me-2"></i>${answer}`;
      correctAnswers.appendChild(li);
    });

    // Show tip if available
    if (this.currentExercise.tip) {
      tipContent.textContent = this.currentExercise.tip;
      tip.style.display = "block";
    } else {
      tip.style.display = "none";
    }

    resultSection.style.display = "block";
    resultSection.classList.add("fade-in");
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
