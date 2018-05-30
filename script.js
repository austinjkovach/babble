var database = firebase.database();
let state = {};

// {
//   user_id
//   users
//   game_id
//   game_end
//   letters
//   words
// }

let $wordList = document.querySelector('#wordList');
let $userList = document.querySelector('#userList');
let $letterList = document.querySelector('#letterList');
let $time = document.querySelector('#time');
let $form = document.querySelector('form');
let $formGroup = document.querySelector('.form-group');
let $buttonContainer = document.querySelector('#buttonContainer');

let $startGame;
let $createGame = document.querySelector('#createGame');

init();

// USERS
function postCreateUser() {
  firebase.database().ref('user/count').once('value', function(snapshot) {
    let userCount = snapshot.val();
    state.user_id = userCount;

    firebase.database().ref('game/' + state.game_id + '/users/' + state.user_id).set({
      score: 0,
    }, function(error) {
      firebase.database().ref('user').set({count: userCount + 1})
    })
  })
}

// WORDS
function getWordScore(word) {
  return word.length;
}

function postWord(word) {
  let wordScore = getWordScore(word);
  firebase.database().ref('game/' + state.game_id + '/words').push({
    word: word,
    user_id: state.user_id
  }).then(error => {
    firebase.database().ref('game/' + state.game_id + '/users/' + state.user_id).set({
      score: state.users[state.user_id].score += wordScore
    });
  });
}

// GAMES
function postCreateGame(hash) {
  const letters = createLetters();
  firebase.database().ref('game/' + hash).set({
    game_end: null,
    words: [],
    letters: letters
  })
}

function getGameById() {
  return firebase.database().ref('game/' + state.game_id).on('value', function(snapshot) {
    state.users = snapshot.val().users
    state.letters = snapshot.val().letters
    state.words = snapshot.val().words

    renderWordList(state.words)
    renderUserList(state.users)
    renderLetterList(state.letters)

    if(!state.game_end && snapshot.val().game_end) {
      state.game_end = snapshot.val().game_end
      startTimeInterval();
    }
  })
}

function startGame() {
  let gameEnd = Math.floor(Date.now() / 1000) + 60;
  firebase.database().ref('game/' + state.game_id).update({game_end: gameEnd})
  $startGame.parentElement.removeChild($startGame);
  $formGroup.style.display = "block"
  $time.innerHTML = "1:00"
}

function startTimeInterval() {
  let interval = setInterval(() => mockTime(state.game_end), 1000);

  let mockTime = function(gameEnd) {
    let now = Math.round(Date.now() / 1000);
    let remaining = Math.floor(gameEnd - now);

    if(state.game_end <= now) {
      clearInterval(interval)
      $form.parentNode.removeChild($form);
    }
    renderTime(remaining);
  }
}

// LETTERS
function createLetters() {
  let letters = [];
  let vowels = 'aeiou'.split('');
  let consonants = 'bcdfghjklmnpqrstvwxyz'.split('');
  let alpha = 'abcdefghijklmnopqrstuvwxyz'.split('');

  randomVowel = () => vowels[Math.floor(Math.random() * 5)]
  randomConsonant = () => consonants[Math.floor(Math.random() * 21)]
  randomLetter = () => alpha[Math.floor(Math.random() * 26)]

  letters.push(randomVowel())
  letters.push(randomVowel())
  letters.push(randomConsonant())
  letters.push(randomConsonant())

  letters.push(randomLetter())
  letters.push(randomLetter())
  letters.push(randomLetter())
  letters.push(randomLetter())
  letters.push(randomLetter())

  return letters;
}

// EVENT HANDLERS
function handleCreateGameClick(e) {
  let hash = generateRandomRoom();
  window.location.href = hash;
  postCreateGame(hash);
}

function handleSubmitWordClick(e) {
  e.preventDefault();
  var word = e.target[0].value;
  e.target[0].value = '';

  if(state.game_end <= (Date.now() / 1000)) {
    return;
  }

  if(word !== '' && wordIsValid(word) && wordIsUnique(word)) {
    postWord(word)
  }

}

function handleStartGameClick(e) {
  startGame();
}

// MISC
function renderStartGameButton() {
  $startGame = document.createElement('button');
  $startGame.innerHTML = "Start Game";
  $startGame.classList = "btn btn-success"
  $buttonContainer.appendChild($startGame);
  $startGame.addEventListener('click', handleStartGameClick);
}

function renderWordList(wordList) {
  while($wordList.firstChild) {
    $wordList.removeChild($wordList.firstChild);
  }
  if(wordList) {
    for(let wordObj in wordList) {
      let $li = document.createElement('li');

      if(wordList[wordObj].user_id === state.user_id) {
        $li.innerHTML = `${wordList[wordObj].word} - You`
      } else {
        $li.innerHTML = `${wordList[wordObj].word} - Player ${wordList[wordObj].user_id}`
      }

      $wordList.appendChild($li);
    }
  }
}

function renderUserList(userList) {
  while($userList.firstChild) {
    $userList.removeChild($userList.firstChild);
  }
  if(userList) {
    for(let userObj in userList) {
      let $li = document.createElement('li');

      if(userObj === `${state.user_id}`) {
        $li.innerHTML = `You - ${userList[userObj].score} points`
      } else {
        $li.innerHTML = `Player ${userObj} - ${userList[userObj].score} points`
      }

      $userList.appendChild($li);
    }
  }
}

function renderLetterList(letterList) {
  while($letterList.firstChild) {
    $letterList.removeChild($letterList.firstChild);
  }
  if(letterList) {
    for(let letterObj of letterList) {
      let $li = document.createElement('li');
      $li.innerHTML = `${letterObj}`

      $letterList.appendChild($li);
    }
  }
}

function calculateRemainingTime() {
  let {game_end} = state;
  let current_time = Date.now() / 60;
  let remaining_time = game_end - current_time
  return remaining_time
}

function renderTime(remainingTime) {
  if(remainingTime > 0) {
    $time.innerHTML = `:${remainingTime}`
  }
  else {
    $time.innerHTML = "Game Over!"
  }
}

function generateRandomRoom() {
  let hash = Math.floor(Math.random() * 1000000)
  return hash;
}

function wordIsValid(word) {
  let letters = state.letters.slice();

  for(let i=0;i<word.length;i++) {
    let index = letters.indexOf(word[i])
    if(index === -1) {
      return false;
    } else {
      letters.splice(index, 1)
    }
  }
  return true;
}

function wordIsUnique(word) {
  if(!state.words) {
    return true;
  }
  for(let key in state.words) {
    if(state.words[key].word === word) {
      return false;
    }
  }
  return true;
}

function init() {

  $form.addEventListener('submit', handleSubmitWordClick);
  $createGame.addEventListener('click', handleCreateGameClick);

  if(window.location.pathname !== '/') {

    renderStartGameButton();

    state.game_id = window.location.pathname.slice(1);

    if(!state.user_id) {
      postCreateUser();
    }
    getGameById();
  }
}