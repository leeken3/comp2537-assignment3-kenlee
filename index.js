// Global game state variables
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let clickCount = 0;
let matchedPairs = 0;
let totalPairs = 0;
let timer = null;
let timeLeft = 0;

// Difficulty settings
const difficulties = {
  easy: { pairs: 3, time: 15 },
  medium: { pairs: 6, time: 30 },
  hard: { pairs: 10, time: 45 },
};

// Fetching Pokemon data from the API
async function fetchPokemonList() {
  const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1500");
  const data = await response.json();
  return data.results;
}

// Fetching a random set of Pokemon
async function getRandomPokemonSet(count) {
  const allPokemon = await fetchPokemonList();
  const selected = [];
  const usedIndexes = new Set();
  while (selected.length < count) {
    const index = Math.floor(Math.random() * allPokemon.length);
    if (!usedIndexes.has(index)) {
      usedIndexes.add(index);
      const pokemon = allPokemon[index];
      const detail = await fetch(pokemon.url).then(res => res.json());
      const image = detail.sprites.other["official-artwork"].front_default;

      if (image) {
        selected.push({ name: pokemon.name, image });
      }
    }
  }
  return selected;
}

// Shuffle function to randomize the card order
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Update the game status on the UI
function updateStatus() {
  document.getElementById("clicks").textContent = clickCount;
  document.getElementById("matched").textContent = matchedPairs;
  document.getElementById("remaining").textContent = totalPairs - matchedPairs;
  document.getElementById("total").textContent = totalPairs;
  document.getElementById("timer").textContent = timeLeft;
}

// Start the timer for the game
function startTimer(duration) {
  clearInterval(timer);
  timeLeft = duration;
  updateStatus();
  timer = setInterval(() => {
    timeLeft--;
    updateStatus();
    if (timeLeft <= 0) {
      clearInterval(timer);
      endGame(false);
    }
  }, 1000);
}

// End the game and show the result
function endGame(won) {
  lockBoard = true;
  alert(won ? "You win!" : "Time's up! Game over!");
}

// Reset the game status
function resetStatus() {
  clickCount = 0;
  matchedPairs = 0;
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  updateStatus();
}

// Create a card element
function createCard(pokemon, index) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.name = pokemon.name;
  card.dataset.index = index;

  const front = document.createElement("img");
  front.className = "front_face";
  front.src = pokemon.image;
  front.alt = pokemon.name;

  const back = document.createElement("img");
  back.className = "back_face";
  back.src = "back.webp";
  back.alt = "Back";

  card.appendChild(front);
  card.appendChild(back);
  return card;
}

// Enable or disable the power-up button
function enablePowerUp(enable) {
  document.getElementById("powerUpBtn").disabled = !enable;
}

document.getElementById("powerUpBtn").addEventListener("click", () => {
  if (lockBoard) return;
  lockBoard = true;
  enablePowerUp(false);

  const cards = document.querySelectorAll(".card");
  cards.forEach(card => {
    if (!card.dataset.matched && !card.classList.contains("flip")) {
      card.classList.add("flip");
    }
  });

  setTimeout(() => {
    cards.forEach(card => {
      if (!card.dataset.matched) {
        card.classList.remove("flip");
      }
    });
    lockBoard = false;
  }, 3000);
});

// Setup the game with the selected difficulty
async function setupGame(difficultyKey) {
  const config = difficulties[difficultyKey];
  totalPairs = config.pairs;
  resetStatus();
  enablePowerUp(true);

  const deck = shuffle((await getRandomPokemonSet(config.pairs)).flatMap(p => [p, { ...p }]));

  const grid = document.getElementById("game_grid");
  grid.innerHTML = "";
  grid.className = difficultyKey;

  deck.forEach((pokemon, i) => {
    const card = createCard(pokemon, i);
    card.addEventListener("click", handleCardClick);
    grid.appendChild(card);
  });

  startTimer(config.time);
}

// Handle card click events
function handleCardClick(event) {
  if (lockBoard) return;
  const card = event.currentTarget;
  if (card.classList.contains("flip") || card.dataset.matched) return;

  card.classList.add("flip");

  if (!firstCard) {
    firstCard = card;
  } else if (firstCard === card) {
    return;
  } else {
    secondCard = card;
    clickCount++;
    lockBoard = true;

    const name1 = firstCard.dataset.name;
    const name2 = secondCard.dataset.name;

    if (name1 === name2) {
      firstCard.dataset.matched = true;
      secondCard.dataset.matched = true;
      matchedPairs++;

      setTimeout(() => {
        firstCard = null;
        secondCard = null;
        lockBoard = false;

        if (matchedPairs === totalPairs) {
          clearInterval(timer);
          endGame(true);
        }
      }, 1000);

    } else {
      setTimeout(() => {
        firstCard.classList.remove("flip");
        secondCard.classList.remove("flip");
        firstCard = null;
        secondCard = null;
        lockBoard = false;
      }, 1000);
    }

    updateStatus();
  }
}

// Allowing buttons to be disabled/enabled for start, reset, and theme toggle
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startBtn").addEventListener("click", () => {
    const difficulty = document.getElementById("difficultySelect").value;
    setupGame(difficulty);
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    const difficulty = document.getElementById("difficultySelect").value;
    setupGame(difficulty);
  });

  document.getElementById("themeToggle").addEventListener("change", (e) => {
    document.body.classList.toggle("dark-theme", e.target.value === "dark");
  });
});
