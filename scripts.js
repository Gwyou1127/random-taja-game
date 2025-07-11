const keys = document.querySelectorAll('.key');
const input = document.getElementById('textInput');
const menuButton = document.getElementById('menuButton');
const menu = document.getElementById('menu');
const darkModeToggle = document.getElementById('darkModeToggle');
const modeText = document.getElementById('modeText');
const modeIcon = document.getElementById('modeIcon');
let isMenuOpen = false;

// 타자 통계 관련 변수
let startTime = null;
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let timerInterval = null;
let lastUpdateTime = null;
let keystrokesInLastMinute = 0;

let cursorPosition = 0;  // 커서 위치 변수 추가

// 사용자 정보 입력 폼 관련 변수
let userInfoForm = null;
let emailInput = null;

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyCsyUg-CKj928g9ub5kFNG6yl6AaR4m2ik",
  authDomain: "makeweb-2a345.firebaseapp.com",
  databaseURL: "https://makeweb-2a345-default-rtdb.firebaseio.com",
  projectId: "makeweb-2a345",
  storageBucket: "makeweb-2a345.firebasestorage.app",
  messagingSenderId: "685681015466",
  appId: "1:685681015466:web:0f9ce3eea418d065a1aed3",
  measurementId: "G-LE5LMCJ2BH"
};

// Firebase 초기화 (중복 초기화 방지)
let app;
try {
  app = firebase.app();
} catch (e) {
  app = firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// 게임 완료 여부를 추적하는 변수 추가
let isGameCompleted = false;

// 통계 초기화
function resetStats() {
  startTime = null;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  stopTimer();
  isGameCompleted = false;  // 게임 완료 상태 초기화
  
  // 초기값을 0으로 설정
  document.getElementById('wpm').textContent = '0';
  document.getElementById('accuracy').textContent = '0%';
  document.getElementById('time').textContent = '0초';

  // 디버깅을 위한 로그
  console.log('Stats Reset');
}

// 통계 업데이트 함수
function updateStats() {
  if (!startTime) {
    document.getElementById('wpm').textContent = '0';
    document.getElementById('accuracy').textContent = '0%';
    document.getElementById('time').textContent = '0초';
    return;
  }
  
  const currentTime = Date.now();
  const elapsedTime = (currentTime - startTime) / 1000; // 초 단위
  
  // CPM 계산 (Characters Per Minute)
  let cpm = 0;
  
  if (elapsedTime > 0) {
    // 분당 문자 수 계산
    cpm = Math.round((correctKeystrokes / elapsedTime) * 60);
  }
  
  // 정확도 계산
  const accuracy = totalKeystrokes === 0 ? 0 : Math.round((correctKeystrokes / totalKeystrokes) * 100);
  
  // DOM 업데이트
  document.getElementById('wpm').textContent = cpm;
  document.getElementById('accuracy').textContent = `${accuracy}%`;
  document.getElementById('time').textContent = `${Math.round(elapsedTime)}초`;

  // 디버깅을 위한 로그
  console.log('Stats:', {
    correctKeystrokes,
    totalKeystrokes,
    elapsedTime,
    cpm,
    accuracy
  });

  checkCompletion();
}

// 타이머 시작
function startTimer() {
  if (!startTime) {
    startTime = Date.now();
    timerInterval = setInterval(updateStats, 1000);
    console.log('Timer Started');
  }
}

// 타이머 중지
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    console.log('Timer Stopped');
  }
}

// 다크모드 토글 함수
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    modeText.textContent = isDarkMode ? '라이트 모드' : '다크 모드';

    const modeIcon = document.getElementById('modeIcon');
    if (isDarkMode) {
        // 다크모드: 달 아이콘
        modeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else {
        // 라이트모드: 해 아이콘
        modeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
}

// localStorage에서 다크모드 설정 불러오기
function loadDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        modeText.textContent = '라이트 모드';
        const modeIcon = document.getElementById('modeIcon');
        // 다크모드: 달 아이콘
        modeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else {
        document.body.classList.remove('dark-mode');
        modeText.textContent = '다크 모드';
        const modeIcon = document.getElementById('modeIcon');
        // 라이트모드: 해 아이콘
        modeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
}

// 다크모드 토글 이벤트 리스너
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

document.addEventListener('DOMContentLoaded', function () {
  const sentences = [
    "hamburger happy hacks",
    "real hilarious situation",
    "what matters is an unbroken spirit",
    "actually good",
    "building the future together",
    "so cute I love it",
    "Yongin Mir Stadium",
    "together we create Yongin's tomorrow",
    "failure is a new beginning",
    "success meets the prepared",
    "well begun is half done",
    "don't give up, success will come",
    "life is short, smile more",
    "thought is power",
    "don't delay today's tasks",
    "no success without failure",
    "you deserve your dream",
    "action creates more than expectations",
    "if you can't avoid it, enjoy it",
    "Dukyoung High School",
    "Make Web Development Club",
    "AI Software Department",
    "Cybersecurity Department",
    "Graphics Software Department",
    "Yongin's specialized high school, Dukyoung",
    "realizing dreams through creative learning",
    "Never just drive",
    "Sheer Driving Pleasure",
    "Believe in yourself",
    "Past is just past",
    "The only cure for grief is action"
  ];
  const qwertyOrder = [
    'tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\',
    'caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', 'enter',
    'shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shift',
    'ctrl', 'win', 'alt', 'space', 'alt', 'fn', 'ctrl',
  ];

  let shuffledKeys = [];
  let keyMapping = {};
  let inputBuffer = [];
  let currentSentence = '';
  let cursorVisible = true;
  let cursorInterval;

  // 통계 초기화
  resetStats();

  function displayRandomSentence() {
    currentSentence = sentences[Math.floor(Math.random() * sentences.length)];
    document.getElementById('reversedText').textContent = currentSentence;
    const uniqueLetters = getUniqueLetters(currentSentence);
    createShuffledKeyboard(uniqueLetters);
    resetStats();
  }

  function shuffle(array) {
    return array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  function getUniqueLetters(sentence) {
    const onlyLetters = sentence
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .split('');
    return [...new Set(onlyLetters)];
  }
  
  function createShuffledKeyboard(letters) {
    const qwertyPositions = [...qwertyOrder];
    keyMapping = {};
  
    // 특수키와 기호는 원래 위치에 고정
    const specialKeys = ['tab', 'caps', 'shift', 'enter', 'ctrl', 'win', 'alt', 'space', 'fn', ';', '\'', ',', '.', '/', '[', ']', '\\'];
    
    // 일반 알파벳 키 위치만 추출
    const normalKeyPositions = qwertyPositions.filter(key => !specialKeys.includes(key));
    
    // 알파벳을 완전히 랜덤하게 섞기
    const shuffledLetters = shuffle([...letters]);
    
    // 알파벳 위치도 랜덤하게 섞기
    const shuffledPositions = shuffle([...normalKeyPositions]);
    
    // 특수키는 원래 위치에 고정
    qwertyPositions.forEach(key => {
      if (specialKeys.includes(key)) {
        keyMapping[key] = key;
      }
    });
    
    // 알파벳을 랜덤한 위치에 배치
    shuffledLetters.forEach((letter, index) => {
      if (index < shuffledPositions.length) {
        keyMapping[shuffledPositions[index]] = letter;
      }
    });
  
    // keyMapping을 전역 변수로 설정
    window.keyMapping = keyMapping;
  
    renderKeyboard();
  }

  function renderKeyboard() {
    const container = document.getElementById('keyboardContainer');
    container.innerHTML = '';

    // 각 행의 키 개수와 시작 인덱스 정의
    const rowConfigs = [
      { size: 14, startIndex: 0 },    // 첫 번째 행: tab부터 \
      { size: 13, startIndex: 14 },   // 두 번째 행: caps부터 enter
      { size: 12, startIndex: 27 },   // 세 번째 행: shift부터 shift
      { size: 7, startIndex: 39 }     // 네 번째 행: ctrl부터 ctrl
    ];

    rowConfigs.forEach(config => {
      const row = document.createElement('div');
      row.className = 'keyboard-row';

      for (let i = 0; i < config.size; i++) {
        const keyChar = qwertyOrder[config.startIndex + i];
        const mappedChar = keyMapping[keyChar] || '';
        const key = document.createElement('div');
        key.className = 'key';
        key.setAttribute('data-key', keyChar);  // 모든 키에 data-key 속성 추가
        
        // 특수 키와 기호는 원래 위치 고정
        if (['tab', 'caps', 'shift', 'enter', 'ctrl', 'win', 'alt', 'space', 'fn', ';', '\'', ',', '.', '/', '[', ']', '\\'].includes(keyChar)) {
          key.classList.add('special-key');
          key.textContent = keyChar.toUpperCase();
        } else {
          key.textContent = mappedChar;
        }

        if (mappedChar === '') {
          key.classList.add('disabled-key');
        }

        key.addEventListener('dragstart', e => e.preventDefault());
        row.appendChild(key);
      }

      container.appendChild(row);
    });
  }

  function updateInputDisplay() {
    const displayText = inputBuffer.join('');
    const beforeCursor = displayText.slice(0, cursorPosition);
    const afterCursor = displayText.slice(cursorPosition);
    input.value = beforeCursor + (cursorVisible ? '|' : '') + afterCursor;
    
    // 원본 문장과 입력된 텍스트를 비교하여 다른 부분을 빨간색으로 표시
    let reversedTextHTML = '';
    for (let i = 0; i < currentSentence.length; i++) {
      if (i < displayText.length && displayText[i] !== currentSentence[i]) {
        reversedTextHTML += `<span style="color: red;">${currentSentence[i]}</span>`;
      } else {
        reversedTextHTML += currentSentence[i];
      }
    }
    document.getElementById('reversedText').innerHTML = reversedTextHTML;
    
    // 타이핑 완료 체크
    if (displayText === currentSentence) {
      checkCompletion();
    }
  }

  // 입력창 선택 방지
  input.addEventListener('selectstart', function(e) {
    e.preventDefault();
  });

  // 입력창 포커스 시 커서 표시
  input.addEventListener('focus', function() {
    cursorVisible = true;
    updateInputDisplay();
  });

  // 입력창 포커스 해제 시 커서 숨김
  input.addEventListener('blur', function() {
    cursorVisible = false;
    updateInputDisplay();
  });

  // 커서 깜빡임 설정
  function setupCursor() {
    cursorInterval = setInterval(function () {
      cursorVisible = !cursorVisible;
      updateInputDisplay();
    }, 500);
    input.focus();
  }

  function checkCompletion() {
    if (inputBuffer.join('') === currentSentence && !isGameCompleted) {
      isGameCompleted = true;  // 게임 완료 상태로 설정
      stopTimer();
      const currentWpm = document.getElementById('wpm').textContent;
      const currentAccuracy = document.getElementById('accuracy').textContent;
      const currentTime = document.getElementById('time').textContent;
      
      // 결과 팝업 업데이트
      document.getElementById('resultWpm').textContent = currentWpm;
      document.getElementById('resultAccuracy').textContent = currentAccuracy;
      document.getElementById('resultTime').textContent = currentTime;
      
      // Firestore에 기록 저장
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo) {
        // 같은 사용자의 이전 기록 찾기
        db.collection('users')
          .where('name', '==', userInfo.name)
          .where('email', '==', userInfo.email)
          .get()
          .then((snapshot) => {
            // 이전 기록 삭제
            const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
            return Promise.all(deletePromises);
          })
          .then(() => {
            // 새로운 기록 저장
            const recordData = {
              name: userInfo.name,
              email: userInfo.email,
              cpm: parseInt(currentWpm),
              accuracy: currentAccuracy,
              time: currentTime,
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            return db.collection('users').add(recordData);
          })
          .then(() => {
            console.log('기록이 성공적으로 저장되었습니다.');
          })
          .catch((error) => {
            console.error('기록 저장 중 오류 발생:', error);
          });
      }
      
      // 결과 팝업 표시
      const resultPopup = document.getElementById('resultPopup');
      resultPopup.style.display = 'flex';
    }
  }

  function hideResultPopup() {
    const popup = document.getElementById('resultPopup');
    popup.style.display = 'none';
    
    // 메인화면으로 이동
    window.location.href = 'index.html';
  }

  // 닫기 버튼 이벤트 리스너
  document.getElementById('closeResult').addEventListener('click', hideResultPopup);

  // 키보드 UI 업데이트 함수
  function updateKeyboardDisplay() {
    const keyElements = document.querySelectorAll('.key');
    keyElements.forEach(keyElement => {
      const char = keyElement.textContent;
      if (char && /^[a-z]$/.test(char)) {
        keyElement.textContent = char.toLowerCase();
      }
    });
  }

  // 키보드 입력 이벤트
  document.addEventListener('keydown', function (e) {
    if (!startTime) {
      startTimer();
    }

    if (e.isComposing || e.keyCode === 229) {
      return;
    }

    // 특수키 목록 (기호 제외)
    const specialKeys = ['tab', 'caps', 'shift', 'enter', 'ctrl', 'win', 'alt', 'space', 'fn'];
    
    // shift 키 활성화 처리
    if (e.key.toLowerCase() === 'shift') {
      const keyElements = document.querySelectorAll('.key');
      keyElements.forEach(keyElement => {
        if (keyElement.textContent === 'SHIFT') {
          keyElement.classList.add('active');
        }
      });
      e.preventDefault();
      return;
    }

    // 다른 특수키를 눌렀을 때는 입력 무시 (기호 제외)
    if (specialKeys.includes(e.key.toLowerCase())) {
      e.preventDefault();
      return;
    }

    // 커서 이동 처리
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (cursorPosition > 0) {
        cursorPosition--;
        updateInputDisplay();
      }
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (cursorPosition < inputBuffer.length) {
        cursorPosition++;
        updateInputDisplay();
      }
      return;
    }

    const key = e.key.toLowerCase();
    const mappedChar = keyMapping[key];

    if (mappedChar) {
      const keyElements = document.querySelectorAll('.key');
      keyElements.forEach(keyElement => {
        if (keyElement.textContent === mappedChar) {
          keyElement.classList.add('active');
          setTimeout(() => {
            keyElement.classList.remove('active');
          }, 100);
        }
      });

      let charToAdd = mappedChar;
      if (e.shiftKey && /^[a-z]$/.test(mappedChar)) {
        charToAdd = mappedChar.toUpperCase();
      }
      inputBuffer.splice(cursorPosition, 0, charToAdd);
      cursorPosition++;
      updateInputDisplay();
      totalKeystrokes++;
      if (inputBuffer.join('') === currentSentence.slice(0, inputBuffer.length)) {
        correctKeystrokes++;
      }
      updateStats();
    } else {
      // 잘못된 키를 눌렀을 때 해당 키만 빨간색으로 표시
      const keyElements = document.querySelectorAll('.key');
      const qwertyIndex = qwertyOrder.indexOf(key);
      
      if (qwertyIndex !== -1) {
        keyElements[qwertyIndex].classList.add('wrong-key');
        setTimeout(() => {
          keyElements[qwertyIndex].classList.remove('wrong-key');
        }, 300);
      }
    }

    // 특수문자 처리
    const specialChars = {
      ';': ';',
      ',': ',',
      '.': '.',
      "'": "'",
      '[': '[',
      ']': ']',
      '\\': '\\',
      '/': '/',
      '`': '`',
      '-': '-',
      '=': '='
    };

    let charToAdd = null;
    if (specialChars[e.key]) {
      charToAdd = specialChars[e.key];
    }

    if (charToAdd) {
      e.preventDefault();  // 기본 동작 방지
      inputBuffer.splice(cursorPosition, 0, charToAdd);
      cursorPosition++;
      updateInputDisplay();
      totalKeystrokes++;
      if (inputBuffer.join('') === currentSentence.slice(0, inputBuffer.length)) {
        correctKeystrokes++;
      }
      updateStats();
      return;
    }

    if (e.key === ' ') {
      e.preventDefault();
      inputBuffer.splice(cursorPosition, 0, ' ');
      cursorPosition++;
      updateInputDisplay();
      totalKeystrokes++;
      if (inputBuffer.join('') === currentSentence.slice(0, inputBuffer.length)) {
        correctKeystrokes++;
      }
      updateStats();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (cursorPosition > 0) {
        inputBuffer.splice(cursorPosition - 1, 1);
        cursorPosition--;
        updateInputDisplay();
        updateStats();
      }
    }
  });

  // shift 키 해제 처리
  document.addEventListener('keyup', function (e) {
    if (e.key.toLowerCase() === 'shift') {
      const keyElements = document.querySelectorAll('.key');
      keyElements.forEach(keyElement => {
        if (keyElement.textContent === 'SHIFT') {
          keyElement.classList.remove('active');
        }
      });
    }
  });

  function preventDragAndSelect() {
    document.addEventListener('dragstart', e => e.preventDefault());
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('mousedown', e => {
      if (e.target !== input) e.preventDefault();
    });
  }

  // 추가 스타일
  const style = document.createElement('style');
  style.textContent = `
    .space-key {
      width: 200px !important;
      font-size: 16px;
    }

    .form-control input {
      caret-color: transparent !important;
    }

    .disabled-key {
      background-color: #eee;
      color: #bbb;
      pointer-events: none;
      border: 1px dashed #ccc;
    }

    body * {
      -webkit-touch-callout: none;
    }

    #reversedText {
      font-size: 24px;
      color: #666;
    }

    body.dark-mode #reversedText {
      color: #999;
    }

      .wrong-key {
    background-color: #ff4d4d !important;
    border: 2px solid red !important;
    animation: blink 0.2s ease-in-out;
  }
  @keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }`;
  document.head.appendChild(style);

  // 초기 실행
  displayRandomSentence();
  setupCursor();
  updateInputDisplay();
  preventDragAndSelect();

  // 페이지 로드 시 다크모드 설정 적용
  loadDarkMode();
});

keys.forEach(key => {
  key.addEventListener('click', () => {
    input.value += key.textContent;
    input.focus();
  });
});

// 햄버거 메뉴 토글
menuButton.addEventListener('click', () => {
  isMenuOpen = !isMenuOpen;
  if (isMenuOpen) {
    menu.style.display = 'block';
    menuButton.classList.add('active');
  } else {
    menu.style.display = 'none';
    menuButton.classList.remove('active');
  }
});

// 메뉴 외부 클릭시 닫기
document.addEventListener('click', (e) => {
  if (!menuButton.contains(e.target) && !menu.contains(e.target)) {
    isMenuOpen = false;
    menu.style.display = 'none';
    menuButton.classList.remove('active');
  }
});

// 사용자 정보 입력 폼 생성
function createUserInfoForm() {
  const form = document.createElement('div');
  form.className = 'user-info-form';
  form.innerHTML = `
    <h2>게임 시작</h2>
    <div class="form-group">
      <label for="userName">이름</label>
      <input type="text" id="userName" placeholder="" required autocomplete="off">
    </div>
    <div class="form-group">
      <label for="userEmail">이메일</label>
      <div class="email-input-group">
        <input type="text" id="emailId" placeholder="" required autocomplete="off">
        <div class="domain-group">
          <span>@</span>
          <input type="text" id="emailDomain" placeholder="주소" required autocomplete="off">
          <div class="domain-select-wrapper">
            <select id="emailSelect">
              <option value="">직접 입력</option>
              <option value="naver.com">naver.com</option>
              <option value="gmail.com">gmail.com</option>
              <option value="hanmail.net">hanmail.net</option>
              <option value="kakao.com">kakao.com</option>
              <option value="icloud.com">icloud.com</option>
            </select>
            <div class="select-arrow"></div>
          </div>
        </div>
      </div>
    </div>
    <button class="start-game-btn" id="startGameBtn">게임 시작</button>
  `;
  document.body.appendChild(form);
  userInfoForm = form;

  // 오버레이 생성
  const overlay = document.createElement('div');
  overlay.className = 'form-overlay';
  document.body.appendChild(overlay);

  // 오버레이 클릭 시 폼 닫기
  overlay.addEventListener('click', () => {
    form.remove();
    overlay.remove();
    userInfoForm = null;
  });

  // 폼 클릭 시 이벤트 전파 중단
  form.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // 이메일 입력 필드 참조
  const emailId = document.getElementById('emailId');
  const emailDomain = document.getElementById('emailDomain');
  const emailSelect = document.getElementById('emailSelect');
  const userName = document.getElementById('userName');
  
  // 이름 입력 필드 - 한글만 입력 가능
  let isComposing = false;
  userName.addEventListener('compositionstart', () => {
    isComposing = true;
  });
  userName.addEventListener('compositionend', (e) => {
    isComposing = false;
    e.target.value = e.target.value.replace(/[^가-힣]/g, '');
  });
  userName.addEventListener('input', (e) => {
    if (!isComposing) {
      e.target.value = e.target.value.replace(/[^가-힣]/g, '');
    }
  });

  // 이메일 아이디 입력 필드 - 영문, 숫자만 입력 가능
  emailId.addEventListener('input', function(e) {
    this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
  });

  // 이메일 도메인 선택 이벤트
  emailSelect.addEventListener('change', function() {
    if (this.value) {
      emailDomain.value = this.value;
      emailDomain.readOnly = true;
    } else {
      emailDomain.value = '';
      emailDomain.readOnly = false;
    }
  });

  // 게임 시작 버튼 이벤트 리스너
  document.getElementById('startGameBtn').addEventListener('click', startGameWithUserInfo);

  // 이름 입력 필드에 엔터키 이벤트 추가
  userName.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      emailId.focus();
    }
  });

  // 이메일 아이디 입력 필드에 엔터키 이벤트 추가
  emailId.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      emailDomain.focus();
    }
  });

  // 이메일 도메인 입력 필드에 엔터키 이벤트 추가
  emailDomain.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      startGameWithUserInfo();
    }
  });
}

// 사용자 정보로 게임 시작
async function startGameWithUserInfo() {
  console.log('startGameWithUserInfo 함수 시작');
  
  const userName = document.getElementById('userName').value;
  const emailId = document.getElementById('emailId').value;
  const emailDomain = document.getElementById('emailDomain').value;
  const userEmail = `${emailId}@${emailDomain}`;

  console.log('입력된 정보:', { userName, userEmail });

  if (!userName || !emailId || !emailDomain) {
    showCustomAlert('입력 오류', '모든 정보를 올바르게 입력해주세요.');
    return;
  }

  // 이름이 한글인지 확인
  if (!/^[가-힣]+$/.test(userName)) {
    showCustomAlert('입력 오류', '이름은 한글만 입력 가능합니다.');
    return;
  }

  // 이메일 아이디가 영문, 숫자로만 구성되어 있는지 확인
  if (!/^[a-zA-Z0-9]+$/.test(emailId)) {
    showCustomAlert('입력 오류', '이메일 아이디는 영문과 숫자만 입력 가능합니다.');
    return;
  }

  // 이메일 형식 검증
  const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(userEmail)) {
    showCustomAlert('입력 오류', '올바른 이메일 형식을 입력해주세요.');
    return;
  }

  try {
    // 동일한 이름과 이메일을 가진 사용자 확인
    const duplicateCheck = await db.collection('users')
      .where('name', '==', userName)
      .where('email', '==', userEmail)
      .get();

    if (!duplicateCheck.empty) {
      // 기존 사용자 확인 메시지 표시
      const confirmMessage = `${userName}님, 다시 도전하시나요?\n\n이전 기록이 있으신데, 새로운 기록으로 도전해보시겠어요?`;
      
      // 커스텀 확인 창 생성
      const customConfirm = document.createElement('div');
      customConfirm.className = 'custom-alert';
      customConfirm.innerHTML = `
        <h3>기존 사용자 확인</h3>
        <p>${confirmMessage}</p>
        <div class="button-group">
          <button onclick="handleExistingUser(true, '${userName}', '${userEmail}')" class="confirm-btn">네, 다시 도전할게요!</button>
          <button onclick="handleExistingUser(false)" class="cancel-btn">아니요, 취소할게요</button>
        </div>
      `;
      
      const overlay = document.createElement('div');
      overlay.className = 'custom-alert-overlay';
      
      document.body.appendChild(overlay);
      document.body.appendChild(customConfirm);
      
      overlay.style.display = 'block';
      customConfirm.style.display = 'block';
      
      return;
    }

    // 새로운 사용자 정보 저장
    await saveUserInfo(userName, userEmail);
  } catch (error) {
    console.error('Error saving user info:', error);
    showCustomAlert('오류 발생', '사용자 정보 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
  }
}

// 기존 사용자 처리 함수
async function handleExistingUser(confirmed, userName, userEmail) {
  const customAlert = document.querySelector('.custom-alert');
  const overlay = document.querySelector('.custom-alert-overlay');
  
  if (customAlert) customAlert.remove();
  if (overlay) overlay.remove();

  if (confirmed) {
    try {
      // 기존 사용자 정보 업데이트
      const userInfo = {
        name: userName,
        email: userEmail,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };

      // localStorage에 저장
      localStorage.setItem('userInfo', JSON.stringify(userInfo));

      // 폼 제거
      if (userInfoForm) {
        userInfoForm.remove();
        userInfoForm = null;
      }

      // 게임 화면으로 이동
      window.location.replace('game.html');
    } catch (error) {
      console.error('Error updating user info:', error);
      showCustomAlert('오류 발생', '사용자 정보 업데이트 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }
}

// 새로운 사용자 정보 저장 함수
async function saveUserInfo(userName, userEmail) {
  const userInfo = {
    name: userName,
    email: userEmail,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  // Firestore에 사용자 정보 저장
  const docRef = await db.collection('users').add(userInfo);
  console.log('Firestore 저장 성공, 문서 ID:', docRef.id);
  
  // localStorage에 저장
  localStorage.setItem('userInfo', JSON.stringify(userInfo));
  console.log('localStorage 저장 성공');

  // 폼 제거
  if (userInfoForm) {
    userInfoForm.remove();
    userInfoForm = null;
  }

  // 게임 화면으로 이동
  window.location.replace('game.html');
}

// 커스텀 알림창 표시 함수
function showCustomAlert(title, message) {
  // 기존 알림창이 있다면 제거
  const existingAlert = document.querySelector('.custom-alert');
  const existingOverlay = document.querySelector('.custom-alert-overlay');
  if (existingAlert) existingAlert.remove();
  if (existingOverlay) existingOverlay.remove();

  // 오버레이 생성
  const overlay = document.createElement('div');
  overlay.className = 'custom-alert-overlay';
  document.body.appendChild(overlay);

  // 알림창 생성
  const alert = document.createElement('div');
  alert.className = 'custom-alert';
  alert.innerHTML = `
    <h3>${title}</h3>
    <p>${message}</p>
    <button onclick="closeCustomAlert()">확인</button>
  `;
  document.body.appendChild(alert);

  // 표시
  overlay.style.display = 'block';
  alert.style.display = 'block';
}

// 커스텀 알림창 닫기 함수
function closeCustomAlert() {
  const alert = document.querySelector('.custom-alert');
  const overlay = document.querySelector('.custom-alert-overlay');
  if (alert) alert.remove();
  if (overlay) overlay.remove();
}

// 기존 startGame 함수 수정
function startGame() {
  resetStats();
  displayRandomSentence();
  setupCursor();
  updateInputDisplay();
}

function showResultPopup() {
    const currentWpm = document.getElementById('wpm').textContent;
    const currentAccuracy = document.getElementById('accuracy').textContent;
    const currentTime = document.getElementById('time').textContent;
    
    const resultMessage = `타자 연습 결과\n\n타자수: ${currentWpm}\n정확도: ${currentAccuracy}\n경과 시간: ${currentTime}`;
    
    alert(resultMessage);
    
    // 결과 표시 후 새로운 문장으로 시작
    displayRandomSentence();
    inputBuffer = [];
    cursorPosition = 0;  // 커서 위치 초기화
    updateInputDisplay();
    resetStats();
}

// 리더보드 데이터 가져오기
async function fetchLeaderboardData() {
  try {
    const snapshot = await db.collection('users')
      .orderBy('cpm', 'desc')
      .limit(100)
      .get();

    // 사용자별 최신 기록만 필터링하고 이전 기록 삭제
    const userRecords = new Map();
    const deletePromises = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const userKey = `${data.name}-${data.email}`;
      
      if (!userRecords.has(userKey)) {
        // 첫 번째 기록인 경우 저장
        userRecords.set(userKey, {
          ...data,
          id: doc.id
        });
      } else {
        // 이미 기록이 있는 경우, 현재 기록이 더 최신이면 이전 기록 삭제
        const existingRecord = userRecords.get(userKey);
        if (data.timestamp.toDate() > existingRecord.timestamp.toDate()) {
          deletePromises.push(db.collection('users').doc(existingRecord.id).delete());
          userRecords.set(userKey, {
            ...data,
            id: doc.id
          });
        } else {
          // 현재 기록이 더 오래된 경우 현재 기록 삭제
          deletePromises.push(db.collection('users').doc(doc.id).delete());
        }
      }
    });

    // 이전 기록 삭제 실행
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`${deletePromises.length}개의 이전 기록이 삭제되었습니다.`);
    }

    // 최신 기록만 배열로 변환하고 CPM 기준으로 정렬
    const records = Array.from(userRecords.values())
      .sort((a, b) => b.cpm - a.cpm);

    return records;
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return [];
  }
}

// 리더보드 테이블 업데이트
function updateLeaderboardTable(records) {
  const tbody = document.querySelector('.leaderboard-table tbody');
  tbody.innerHTML = '';

  records.forEach((data, index) => {
    const row = document.createElement('tr');
    const rank = index + 1;
    
    // 상위 3등 스타일 적용
    if (rank <= 3) {
      row.classList.add(`top-${rank}`);
    }

    row.innerHTML = `
      <td class="rank">${rank}</td>
      <td>${data.name}</td>
      <td>${data.cpm || '-'}</td>
      <td>${data.accuracy || '-'}</td>
      <td>${data.time || '-'}</td>
    `;
    tbody.appendChild(row);
  });
}

// 리더보드 새로고침
async function refreshLeaderboard() {
  const tbody = document.querySelector('.leaderboard-table tbody');
  tbody.innerHTML = '<tr><td colspan="5" class="loading">로딩 중...</td></tr>';

  const records = await fetchLeaderboardData();
  
  if (records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="no-data">데이터가 없습니다.</td></tr>';
    return;
  }

  updateLeaderboardTable(records);
}

// 페이지 로드 시 리더보드 초기화
document.addEventListener('DOMContentLoaded', () => {
  refreshLeaderboard();
  
  // 새로고침 버튼 이벤트 리스너
  const refreshBtn = document.querySelector('.refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshLeaderboard);
  }
});