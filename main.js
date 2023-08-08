var questions = [];
var currentQuestion = 0;
var score = 0;
var totQuestions = 0;
var timeRemaining = 0;
var correctAnswers = [];

var quizContainer = document.getElementById('quiz-container');
var questionEl = document.getElementById('question');
var choicesEl = document.getElementById('choices');
var nextButton = document.getElementById('next');
var prevButton = document.getElementById('prev');
var resultCont = document.getElementById('result');
var correctAnswersEl = document.getElementById('correct-answers');
var retryButton;
var progressBar = document.getElementById('progress');
var scoreEl = document.getElementById('score');
var timerEl = document.getElementById('timer');

// Fetch questions from the backend
fetch('/get-questions')
    .then(response => response.json())
    .then(data => {
        questions = data;
        totQuestions = questions.length;
        timeRemaining = totQuestions * 30; // Assuming 30 seconds per question
        loadQuestion(currentQuestion);
    })
    .catch(error => console.error("Error fetching questions:", error));

function loadQuestion(questionIndex) {
    var q = questions[questionIndex];
    questionEl.textContent = (questionIndex + 1) + '. ' + q.question;
    choicesEl.innerHTML = '';

    var buttonColors = ["#007BFF", "#28a745", "#dc3545", "#ffc107"];
    var choicesLabels = ["A", "B", "C", "D"];
    for (var i = 0; i < q.choices.length; i++) {
        var choice = document.createElement("button");
        choice.classList.add("choice");
        choice.textContent = choicesLabels[i] + ': ' + q.choices[i];
        choice.id = 'btn' + i;
        choice.style.backgroundColor = buttonColors[i];
        choicesEl.appendChild(choice);

        choice.addEventListener("click", function() {
            var selectedChoiceId = this.id;
            var selectedChoiceIndex = parseInt(selectedChoiceId.replace('btn', ''));

            // Prevent changing the choice once a selection has been made
            if (correctAnswers[questionIndex] != null) {
                return;
            }

            // Change the style of all choices back to the initial state
            var choices = document.querySelectorAll('.choice');
            for (var j = 0; j < choices.length; j++) {
                choices[j].style.backgroundColor = buttonColors[j];
                choices[j].style.color = "black";
            }

            // Change the style of the clicked button to indicate selection
            this.style.backgroundColor = "#555";
            this.style.color = "white";

            // Validate answer with backend
            fetch('/validate-answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: q.question,
                    answer: this.textContent
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.correct) {
                    score++;
                }
            })
            .catch(error => console.error("Error validating answer:", error));

            // Save the correct answer when a choice is selected
            correctAnswers[questionIndex] = q.choices[q.answer];
        });
    }

    progressBar.style.width = ((questionIndex + 1) / totQuestions * 100) + '%';
    startTimer();
}

function startTimer() {
    var minutes = Math.floor(timeRemaining / 60);
    var seconds = timeRemaining % 60;
    timerEl.textContent = 'Time Remaining: ' + formatTime(minutes) + ':' + formatTime(seconds);
    var timer = setInterval(function() {
        timeRemaining--;
        minutes = Math.floor(timeRemaining / 60);
        seconds = timeRemaining % 60;
        timerEl.textContent = 'Time Remaining: ' + formatTime(minutes) + ':' + formatTime(seconds);
        if (timeRemaining <= 0) {
            clearInterval(timer);
            endQuiz();
        }
    }, 1000);
}

// Helper function to format time
function formatTime(time) {
    return time < 10 ? '0' + time : time;
}

function loadPreviousQuestion() {
    if(currentQuestion > 0){
        currentQuestion--;
        loadQuestion(currentQuestion);
    }
}

function endQuiz() {
    quizContainer.style.display = 'none';
    resultCont.style.display = '';
    scoreEl.textContent = 'Your Score: ' + score;
    retryButton = document.getElementById('retry');
    if (!retryButton) {
        retryButton = document.createElement("button");
        retryButton.id = 'retry';
        retryButton.textContent = 'Try Again';
        retryButton.style.backgroundColor = '#007BFF';
        retryButton.style.color = 'white';
        retryButton.style.cursor = 'pointer';
        resultCont.appendChild(retryButton);
        retryButton.addEventListener("click", resetQuiz);
    }
    // Display the correct answers at the end of the quiz
    correctAnswersEl.innerHTML = 'Correct Answers:<br>';
    for (var i = 0; i < correctAnswers.length; i++) {
        correctAnswersEl.innerHTML += 'Question ' + (i + 1) + ': ' + correctAnswers[i] + '<br>';
    }
    correctAnswersEl.style.display = 'block';
}

function resetQuiz() {
    resultCont.style.display = 'none';
    retryButton.remove();
    score = 0;
    currentQuestion = 0;
    nextButton.textContent = 'Next';
    quizContainer.style.display = '';
    timeRemaining = totQuestions * 30;
    correctAnswers = [];
    correctAnswersEl.style.display = 'none';
    correctAnswersEl.innerHTML = '';
}

nextButton.addEventListener("click", function(){
    if(currentQuestion < totQuestions - 1){
        currentQuestion++;
        loadQuestion(currentQuestion);
    } else {
        endQuiz();
    }
});

prevButton.addEventListener("click", loadPreviousQuestion);
