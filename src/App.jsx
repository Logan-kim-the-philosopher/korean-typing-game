import { useState, useEffect, useCallback, useRef } from 'react';

// Airtable 설정 (환경 변수 사용)
const USE_MOCK_DATA = !import.meta.env.VITE_AIRTABLE_TOKEN; // 토큰이 없으면 Mock 데이터 사용
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || '';
const AIRTABLE_TABLE_NAME = import.meta.env.VITE_AIRTABLE_TABLE_NAME || '';
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN || '';

// 목업 커리큘럼 (Airtable 연결 실패 시 사용)
const MOCK_CURRICULUMS = [
  { id: 'travel', name: 'Travel', icon: '✈️', description: 'Essential Korean for travel' },
  { id: 'study', name: 'Study Abroad', icon: '📚', description: 'Academic and campus life expressions' },
  { id: 'work', name: 'Employment', icon: '💼', description: 'Workplace and job-related vocabulary' },
];

// 목업 데이터 (커리큘럼별)
const MOCK_WORDS = [
  // 여행 커리큘럼
  { korean: '공항', english: 'airport', level: 'beginner1', category: 'noun', curriculum: 'travel' },
  { korean: '호텔', english: 'hotel', level: 'beginner1', category: 'noun', curriculum: 'travel' },
  { korean: '지하철', english: 'subway', level: 'beginner1', category: 'noun', curriculum: 'travel' },
  { korean: '택시', english: 'taxi', level: 'beginner1', category: 'noun', curriculum: 'travel' },
  { korean: '식당', english: 'restaurant', level: 'beginner1', category: 'noun', curriculum: 'travel' },
  { korean: '관광', english: 'tourism', level: 'beginner1', category: 'noun', curriculum: 'travel' },
  { korean: '예약', english: 'reservation', level: 'beginner1', category: 'noun', curriculum: 'travel' },
  { korean: '여권', english: 'passport', level: 'beginner1', category: 'noun', curriculum: 'travel' },
  { korean: '짐', english: 'luggage', level: 'beginner1', category: 'noun', curriculum: 'travel' },
  { korean: '길', english: 'road', level: 'beginner1', category: 'noun', curriculum: 'travel' },

  // 유학 커리큘럼
  { korean: '학교', english: 'school', level: 'beginner1', category: 'noun', curriculum: 'study' },
  { korean: '도서관', english: 'library', level: 'beginner1', category: 'noun', curriculum: 'study' },
  { korean: '수업', english: 'class', level: 'beginner1', category: 'noun', curriculum: 'study' },
  { korean: '교수', english: 'professor', level: 'beginner1', category: 'noun', curriculum: 'study' },
  { korean: '숙제', english: 'homework', level: 'beginner1', category: 'noun', curriculum: 'study' },
  { korean: '시험', english: 'exam', level: 'beginner1', category: 'noun', curriculum: 'study' },
  { korean: '학생', english: 'student', level: 'beginner1', category: 'noun', curriculum: 'study' },
  { korean: '기숙사', english: 'dormitory', level: 'beginner1', category: 'noun', curriculum: 'study' },
  { korean: '공부', english: 'study', level: 'beginner1', category: 'noun', curriculum: 'study' },
  { korean: '졸업', english: 'graduation', level: 'beginner1', category: 'noun', curriculum: 'study' },

  // 취업 커리큘럼
  { korean: '회사', english: 'company', level: 'beginner1', category: 'noun', curriculum: 'work' },
  { korean: '면접', english: 'interview', level: 'beginner1', category: 'noun', curriculum: 'work' },
  { korean: '이력서', english: 'resume', level: 'beginner1', category: 'noun', curriculum: 'work' },
  { korean: '직원', english: 'employee', level: 'beginner1', category: 'noun', curriculum: 'work' },
  { korean: '회의', english: 'meeting', level: 'beginner1', category: 'noun', curriculum: 'work' },
  { korean: '사무실', english: 'office', level: 'beginner1', category: 'noun', curriculum: 'work' },
  { korean: '급여', english: 'salary', level: 'beginner1', category: 'noun', curriculum: 'work' },
  { korean: '계약', english: 'contract', level: 'beginner1', category: 'noun', curriculum: 'work' },
  { korean: '동료', english: 'colleague', level: 'beginner1', category: 'noun', curriculum: 'work' },
  { korean: '업무', english: 'work/task', level: 'beginner1', category: 'noun', curriculum: 'work' },
];

// 한글 자모 분해 함수 (es-hangul 대체)
const disassembleHangul = (word) => {
  const HANGUL_START = 0xAC00;
  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  // 복합 모음 분해 매핑 (실제 키보드에서 여러 키를 눌러야 하는 것만)
  // ㅐ, ㅔ, ㅒ, ㅖ는 단일 키이므로 분리하지 않음
  const complexJungDecompose = {
    'ㅘ': ['ㅗ', 'ㅏ'],
    'ㅙ': ['ㅗ', 'ㅏ', 'ㅣ'],
    'ㅚ': ['ㅗ', 'ㅣ'],
    'ㅝ': ['ㅜ', 'ㅓ'],
    'ㅞ': ['ㅜ', 'ㅓ', 'ㅣ'],
    'ㅟ': ['ㅜ', 'ㅣ'],
    'ㅢ': ['ㅡ', 'ㅣ']
  };

  // 복합 자음 분해 매핑
  const complexJongDecompose = {
    'ㄳ': ['ㄱ', 'ㅅ'],
    'ㄵ': ['ㄴ', 'ㅈ'],
    'ㄶ': ['ㄴ', 'ㅎ'],
    'ㄺ': ['ㄹ', 'ㄱ'],
    'ㄻ': ['ㄹ', 'ㅁ'],
    'ㄼ': ['ㄹ', 'ㅂ'],
    'ㄽ': ['ㄹ', 'ㅅ'],
    'ㄾ': ['ㄹ', 'ㅌ'],
    'ㄿ': ['ㄹ', 'ㅍ'],
    'ㅀ': ['ㄹ', 'ㅎ'],
    'ㅄ': ['ㅂ', 'ㅅ']
  };

  const result = [];

  for (let char of word) {
    const code = char.charCodeAt(0);

    if (code >= HANGUL_START && code <= 0xD7A3) {
      const hangulCode = code - HANGUL_START;
      const choIndex = Math.floor(hangulCode / 588);
      const jungIndex = Math.floor((hangulCode % 588) / 28);
      const jongIndex = hangulCode % 28;

      // 초성 추가
      result.push(CHO[choIndex]);

      // 중성 추가 (복합 모음인 경우 분해)
      const jung = JUNG[jungIndex];
      if (complexJungDecompose[jung]) {
        result.push(...complexJungDecompose[jung]);
      } else {
        result.push(jung);
      }

      // 종성 추가 (복합 자음인 경우 분해)
      if (jongIndex !== 0) {
        const jong = JONG[jongIndex];
        if (complexJongDecompose[jong]) {
          result.push(...complexJongDecompose[jong]);
        } else {
          result.push(jong);
        }
      }
    } else {
      result.push(char);
    }
  }

  return result;
};

// 자모 -> 키보드 매핑 (두벌식)
const jamoToKey = {
  'ㄱ': 'r', 'ㄲ': 'R', 'ㄴ': 's', 'ㄷ': 'e', 'ㄸ': 'E', 'ㄹ': 'f',
  'ㅁ': 'a', 'ㅂ': 'q', 'ㅃ': 'Q', 'ㅅ': 't', 'ㅆ': 'T', 'ㅇ': 'd',
  'ㅈ': 'w', 'ㅉ': 'W', 'ㅊ': 'c', 'ㅋ': 'z', 'ㅌ': 'x', 'ㅍ': 'v', 'ㅎ': 'g',
  'ㅏ': 'k', 'ㅐ': 'o', 'ㅑ': 'i', 'ㅒ': 'O', 'ㅓ': 'j', 'ㅔ': 'p',
  'ㅕ': 'u', 'ㅖ': 'P', 'ㅗ': 'h', 'ㅛ': 'y', 'ㅜ': 'n', 'ㅠ': 'b',
  'ㅡ': 'm', 'ㅣ': 'l', 'ㅘ': 'hk', 'ㅙ': 'ho', 'ㅚ': 'hl', 'ㅝ': 'nj',
  'ㅞ': 'np', 'ㅟ': 'nl', 'ㅢ': 'ml',
  ' ': ' '  // 스페이스바
};

// 키 위치 매핑
const keyPositions = {
  // 왼손
  'r': { row: 1, col: 3, hand: 'left' }, 't': { row: 1, col: 4, hand: 'left' },
  'e': { row: 2, col: 2, hand: 'left' }, 'w': { row: 2, col: 1, hand: 'left' },
  's': { row: 3, col: 1, hand: 'left' }, 'f': { row: 3, col: 3, hand: 'left' },
  'a': { row: 4, col: 0, hand: 'left' }, 'q': { row: 4, col: 0, hand: 'left' },
  'x': { row: 5, col: 1, hand: 'left' }, 'z': { row: 5, col: 0, hand: 'left' },
  'c': { row: 5, col: 2, hand: 'left' }, 'v': { row: 5, col: 3, hand: 'left' },
  'd': { row: 3, col: 2, hand: 'left' }, 'g': { row: 3, col: 4, hand: 'left' },
  // 오른손
  'y': { row: 1, col: 5, hand: 'right' }, 'u': { row: 1, col: 6, hand: 'right' },
  'i': { row: 1, col: 7, hand: 'right' }, 'o': { row: 1, col: 8, hand: 'right' },
  'p': { row: 1, col: 9, hand: 'right' }, 'h': { row: 2, col: 5, hand: 'right' },
  'j': { row: 2, col: 6, hand: 'right' }, 'k': { row: 2, col: 7, hand: 'right' },
  'l': { row: 2, col: 8, hand: 'right' }, 'n': { row: 3, col: 5, hand: 'right' },
  'b': { row: 3, col: 4, hand: 'right' }, 'm': { row: 3, col: 6, hand: 'right' },
};

// Airtable에서 모든 데이터 가져오기 (커리큘럼 추출용)
async function fetchAllWords() {
  console.log('fetchAllWords() called, USE_MOCK_DATA:', USE_MOCK_DATA);

  if (USE_MOCK_DATA) {
    console.log('Using MOCK_WORDS');
    return MOCK_WORDS;
  }

  try {
    console.log('Fetching from Airtable...');
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
    console.log('URL:', url);

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Airtable data:', data);

    const words = data.records.map(r => ({
      korean: r.fields['한국어'],
      english: r.fields['영어 뜻'],
      level: r.fields['레벨'],
      category: r.fields['품사'],
      curriculum: r.fields['커리큘럼ID'],
      curriculumName: r.fields['커리큘럼이름'],
      curriculumIcon: r.fields['커리큘럼아이콘'],
      curriculumDescription: r.fields['커리큘럼설명']
    }));

    console.log('Mapped words:', words);
    return words;
  } catch (error) {
    console.error('Airtable fetch error:', error);
    return MOCK_WORDS;
  }
}

// Airtable에서 커리큘럼 목록 추출
async function fetchCurriculums() {
  const allWords = await fetchAllWords();

  // 커리큘럼ID별로 그룹화
  const curriculumMap = new Map();

  allWords.forEach(word => {
    if (word.curriculum && !curriculumMap.has(word.curriculum)) {
      curriculumMap.set(word.curriculum, {
        id: word.curriculum,
        name: word.curriculumName || word.curriculum,
        icon: word.curriculumIcon || '📚',
        description: word.curriculumDescription || ''
      });
    }
  });

  // 커리큘럼 ID 순서로 정렬 (W1-1, W1-2, W1-3, W2-1, W2-2, W2-3...)
  const curriculums = Array.from(curriculumMap.values());
  curriculums.sort((a, b) => {
    return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
  });

  return curriculums;
}

// Airtable에서 데이터 가져오기 (커리큘럼별)
async function fetchWords(curriculum) {
  console.log('fetchWords() called with curriculum:', curriculum);

  if (USE_MOCK_DATA) {
    console.log('Using MOCK_WORDS for fetchWords');
    return MOCK_WORDS.filter(w => w.curriculum === curriculum);
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula={커리큘럼ID}='${curriculum}'`;
    console.log('fetchWords URL:', url);

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });

    console.log('fetchWords response status:', response.status);

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('fetchWords data:', data);

    const words = data.records.map(r => ({
      korean: r.fields['한국어'],
      english: r.fields['영어 뜻'],
      level: r.fields['레벨'],
      category: r.fields['품사'],
      curriculum: r.fields['커리큘럼ID']
    }));

    console.log('fetchWords mapped words:', words);
    return words;
  } catch (error) {
    console.error('Airtable fetchWords error:', error);
    return MOCK_WORDS.filter(w => w.curriculum === curriculum);
  }
}

// 키보드 컴포넌트
function Keyboard({ currentKey, isMobile }) {
  const desktopLayout = [
    [
      { kor: 'ㅂ', eng: 'q' }, { kor: 'ㅈ', eng: 'w' }, { kor: 'ㄷ', eng: 'e' }, { kor: 'ㄱ', eng: 'r' },
      { kor: 'ㅅ', eng: 't' }, { kor: 'ㅛ', eng: 'y' }, { kor: 'ㅕ', eng: 'u' }, { kor: 'ㅑ', eng: 'i' },
      { kor: 'ㅐ', eng: 'o' }, { kor: 'ㅔ', eng: 'p' }
    ],
    [
      { kor: 'ㅁ', eng: 'a' }, { kor: 'ㄴ', eng: 's' }, { kor: 'ㅇ', eng: 'd' }, { kor: 'ㄹ', eng: 'f' },
      { kor: 'ㅎ', eng: 'g' }, { kor: 'ㅗ', eng: 'h' }, { kor: 'ㅓ', eng: 'j' }, { kor: 'ㅏ', eng: 'k' },
      { kor: 'ㅣ', eng: 'l' }
    ],
    [
      { kor: 'ㅋ', eng: 'z' }, { kor: 'ㅌ', eng: 'x' }, { kor: 'ㅊ', eng: 'c' }, { kor: 'ㅍ', eng: 'v' },
      { kor: 'ㅠ', eng: 'b' }, { kor: 'ㅜ', eng: 'n' }, { kor: 'ㅡ', eng: 'm' }
    ]
  ];

  const mobileLayout = [
    [
      { kor: 'ㅂ', eng: 'q' }, { kor: 'ㅈ', eng: 'w' }, { kor: 'ㄷ', eng: 'e' }, { kor: 'ㄱ', eng: 'r' },
      { kor: 'ㅅ', eng: 't' }
    ],
    [
      { kor: 'ㅛ', eng: 'y' }, { kor: 'ㅕ', eng: 'u' }, { kor: 'ㅑ', eng: 'i' }, { kor: 'ㅐ', eng: 'o' },
      { kor: 'ㅔ', eng: 'p' }
    ],
    [
      { kor: 'ㅁ', eng: 'a' }, { kor: 'ㄴ', eng: 's' }, { kor: 'ㅇ', eng: 'd' }, { kor: 'ㄹ', eng: 'f' },
      { kor: 'ㅎ', eng: 'g' }
    ],
    [
      { kor: 'ㅗ', eng: 'h' }, { kor: 'ㅓ', eng: 'j' }, { kor: 'ㅏ', eng: 'k' }, { kor: 'ㅣ', eng: 'l' }
    ],
    [
      { kor: 'ㅋ', eng: 'z' }, { kor: 'ㅌ', eng: 'x' }, { kor: 'ㅊ', eng: 'c' }, { kor: 'ㅍ', eng: 'v' },
      { kor: 'ㅠ', eng: 'b' }
    ],
    [
      { kor: 'ㅜ', eng: 'n' }, { kor: 'ㅡ', eng: 'm' }
    ]
  ];

  const keyLayout = isMobile ? mobileLayout : desktopLayout;

  // Shift 키가 필요한지 확인 (대문자인 경우)
  const needsShift = currentKey && currentKey === currentKey.toUpperCase() && currentKey !== currentKey.toLowerCase();

  const getKeyClass = (key) => {
    if (!key || !currentKey || typeof currentKey !== 'string') {
      return 'soft-key';
    }

    const isActive = (
      currentKey === key.eng ||
      currentKey.toLowerCase() === key.eng.toLowerCase()
    );

    return `soft-key ${isActive ? 'active' : ''}`;
  };

  const getShiftKeyClass = () => {
    return `soft-key soft-key-wide ${needsShift ? 'active' : ''}`;
  };

  const getSpacebarClass = () => {
    const isActive = currentKey === ' ';
    return `soft-key soft-key-space ${isActive ? 'active' : ''}`;
  };

  return (
    <div className="keyboard-grid">
      {isMobile ? (
        <>
          {keyLayout.map((row, i) => (
            <div key={i} className="keyboard-row">
              {row.map((key) => (
                <div key={key.eng} className={getKeyClass(key)}>
                  <div className="text-lg font-bold">{key.kor}</div>
                  <div className="key-sub">{key.eng.toUpperCase()}</div>
                </div>
              ))}
            </div>
          ))}
          <div className="keyboard-row keyboard-row-centered">
            <div className={getShiftKeyClass()}>
              <span className="text-sm">Shift</span>
            </div>
          </div>
        </>
      ) : (
        <>
          {desktopLayout.slice(0, 2).map((row, i) => (
            <div key={i} className="keyboard-row">
              {row.map((key) => (
                <div key={key.eng} className={getKeyClass(key)}>
                  <div className="text-lg font-bold">{key.kor}</div>
                  <div className="key-sub">{key.eng.toUpperCase()}</div>
                </div>
              ))}
            </div>
          ))}
          <div className="keyboard-row">
            <div className={getShiftKeyClass()}>
              <span className="text-sm">Shift</span>
            </div>
            {desktopLayout[2].map((key) => (
              <div key={key.eng} className={getKeyClass(key)}>
                <div className="text-lg font-bold">{key.kor}</div>
                <div className="key-sub">{key.eng.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="keyboard-row keyboard-row-space">
        <div className={getSpacebarClass()}>
          <span className="text-sm">Spacebar</span>
        </div>
      </div>
    </div>
  );
}

// 커리큘럼 선택 화면 컴포넌트
function CurriculumSelection({ onSelect, student, curriculums, loading }) {
  // localStorage에서 각 커리큘럼별 완료 상태 가져오기
  const isCompleted = (curriculumId) => {
    const saved = localStorage.getItem(`korean-typing-progress-${curriculumId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return data.completed === true;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  if (loading) {
    return (
      <div className="app-shell">
        <div className="card-panel panel-soft loading-card reveal">
          <div className="text-lg font-semibold">Loading curriculums...</div>
          <div className="text-muted text-sm mt-2">Getting your practice ready</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12 reveal">
          <h1 className="page-title">
            <span>Korean</span> Typing Practice
          </h1>
          {student ? (
            <p className="page-subtitle">{student}, welcome back.</p>
          ) : (
            <p className="page-subtitle">Warm up your fingers with focused drills.</p>
          )}
        </div>

        <h2 className="section-title text-center mb-10 reveal">
          Select a Curriculum
        </h2>

        <div className={`grid gap-8 ${
          curriculums.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
          curriculums.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' :
          'grid-cols-1 md:grid-cols-3'
        }`}>
          {curriculums.map((curriculum, i) => {
            const completed = isCompleted(curriculum.id);
            return (
              <button
                key={curriculum.id}
                onClick={() => onSelect(curriculum.id)}
                className={`curriculum-card reveal ${completed ? 'is-complete' : ''}`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="card-sheen"></div>

                {/* 완료 표시 */}
                {completed && (
                  <div className="badge-complete">
                    <span>✓</span>
                    <span>Complete</span>
                  </div>
                )}

                <div className="relative z-10">
                  <div className="curriculum-icon">{curriculum.icon}</div>
                  <h3 className="curriculum-title">{curriculum.name}</h3>
                  <p className="curriculum-desc">{curriculum.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 메인 앱 컴포넌트
function App() {
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentJamoIndex, setCurrentJamoIndex] = useState(0);
  const [currentJamos, setCurrentJamos] = useState([]);
  const [completedWords, setCompletedWords] = useState([]);
  const [mistakeWords, setMistakeWords] = useState([]);
  const [stats, setStats] = useState({ totalAttempts: 0, correctAttempts: 0 });
  const [isCompleted, setIsCompleted] = useState(false);
  const [level, setLevel] = useState('beginner1');
  const [curriculum, setCurriculum] = useState('');
  const [student, setStudent] = useState('');
  const [wrongKeyAttempts, setWrongKeyAttempts] = useState(0);
  const [showError, setShowError] = useState(false);
  const [curriculums, setCurriculums] = useState([]);
  const [curriculumsLoading, setCurriculumsLoading] = useState(true);
  const [useMobileKeyboard, setUseMobileKeyboard] = useState(false);
  const [mobileInput, setMobileInput] = useState('');
  const mobileInputRef = useRef(null);
  const mobileJamoCountRef = useRef(0);

  // URL 파라미터에서 커리큘럼, 레벨, 학생 이름 가져오기
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCurriculum = params.get('curriculum');
    const urlLevel = params.get('level');
    const urlStudent = params.get('student');

    if (urlCurriculum) setCurriculum(urlCurriculum);
    if (urlLevel) setLevel(urlLevel);
    if (urlStudent) setStudent(urlStudent);
  }, []);

  // 커리큘럼 목록 로드
  useEffect(() => {
    fetchCurriculums().then(data => {
      setCurriculums(data);
      setCurriculumsLoading(false);
    }).catch(error => {
      console.error('Failed to load curriculums:', error);
      setCurriculums(MOCK_CURRICULUMS);
      setCurriculumsLoading(false);
    });
  }, []);

  useEffect(() => {
    const updateKeyboardLayout = () => {
      setUseMobileKeyboard(window.innerWidth <= 840);
    };
    updateKeyboardLayout();
    window.addEventListener('resize', updateKeyboardLayout);
    return () => window.removeEventListener('resize', updateKeyboardLayout);
  }, []);

  useEffect(() => {
    if (useMobileKeyboard && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [useMobileKeyboard, currentWordIndex]);

  // 커리큘럼이 변경되면 해당 커리큘럼의 데이터 로드
  useEffect(() => {
    if (curriculum) {
      const saved = localStorage.getItem(`korean-typing-progress-${curriculum}`);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          // completed가 true면 모든 단어를 다시 시작 (복습 모드)
          if (data.completed) {
            setCompletedWords([]);
            setMistakeWords([]);
            setStats({ totalAttempts: 0, correctAttempts: 0 });
          } else {
            setCompletedWords(data.completedWords || []);
            setStats(data.stats || { totalAttempts: 0, correctAttempts: 0 });
            setMistakeWords(data.mistakeWords || []);
          }
        } catch (e) {
          console.error('localStorage parse error:', e);
        }
      } else {
        // 새 커리큘럼이면 초기화
        setCompletedWords([]);
        setStats({ totalAttempts: 0, correctAttempts: 0 });
        setMistakeWords([]);
      }
    }
  }, [curriculum]);

  // 단어 데이터 로드
  useEffect(() => {
    console.log('Words loading useEffect triggered, curriculum:', curriculum);
    if (curriculum) {
      console.log('Calling fetchWords with curriculum:', curriculum);
      fetchWords(curriculum).then(words => {
        console.log('fetchWords returned:', words);
        setWords(words);
      });
    }
  }, [curriculum]);

  // 현재 단어의 자모 분해
  useEffect(() => {
    if (words.length > 0 && currentWordIndex < words.length) {
      const word = words[currentWordIndex];
      const jamos = disassembleHangul(word.korean);
      setCurrentJamos(jamos);
      setCurrentJamoIndex(0);
      setWrongKeyAttempts(0);
      setMobileInput('');
      mobileJamoCountRef.current = 0;
    }
  }, [words, currentWordIndex]);

  // localStorage에 저장 (커리큘럼별)
  const saveToLocalStorage = useCallback((markAsCompleted = false) => {
    if (!curriculum) return;

    // 기존 데이터 가져오기
    const saved = localStorage.getItem(`korean-typing-progress-${curriculum}`);
    let existingData = {};

    if (saved) {
      try {
        existingData = JSON.parse(saved);
      } catch (e) {
        console.error('localStorage parse error:', e);
      }
    }

    const data = {
      completedWords,
      stats,
      mistakeWords,
      completed: markAsCompleted || existingData.completed || false
    };
    localStorage.setItem(`korean-typing-progress-${curriculum}`, JSON.stringify(data));
  }, [curriculum, completedWords, stats, mistakeWords]);

  const completeWord = useCallback(() => {
    const currentWord = words[currentWordIndex];
    if (!currentWord) return;

    setCompletedWords(prev => {
      if (!prev.includes(currentWord.korean)) {
        return [...prev, currentWord.korean];
      }
      return prev;
    });

    if (wrongKeyAttempts > 0) {
      setMistakeWords(prev => {
        if (!prev.includes(currentWord.korean)) {
          return [...prev, currentWord.korean];
        }
        return prev;
      });
    } else {
      setMistakeWords(prev => {
        if (prev.includes(currentWord.korean)) {
          return prev.filter(word => word !== currentWord.korean);
        }
        return prev;
      });
    }

    if (currentWordIndex + 1 >= words.length) {
      setIsCompleted(true);
    } else {
      setTimeout(() => {
        setCurrentWordIndex(prev => prev + 1);
      }, 300);
    }
  }, [words, currentWordIndex, wrongKeyAttempts]);

  // 키 입력 처리
  const handleKeyPress = useCallback((event) => {
    if (useMobileKeyboard) return;
    if (isCompleted || words.length === 0) return;

    const currentJamo = currentJamos[currentJamoIndex];
    const expectedKey = jamoToKey[currentJamo];
    const pressedKey = event.key;

    console.log('Key pressed:', {
      jamo: currentJamo,
      expectedKey: expectedKey,
      pressedKey: pressedKey,
      match: pressedKey === expectedKey
    });

    // 특수 키 무시
    if (['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'Escape'].includes(pressedKey)) {
      return;
    }

    setStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1
    }));

    // 정확한 키 매칭 (대소문자 엄격 구분)
    // 복합 자모(ㅘ='hk', ㅝ='nj' 등)의 경우에만 부분 매칭 허용
    let isMatch = false;

    if (expectedKey && expectedKey.length > 1) {
      // 복합 자모: 첫 번째 키만 확인 (예: 'hk'에서 'h' 입력)
      isMatch = expectedKey.startsWith(pressedKey);
    } else {
      // 단일 키: 정확히 일치해야 함 (Shift 포함)
      isMatch = pressedKey === expectedKey;
    }

    console.log('isMatch:', isMatch);

    if (isMatch) {
      // 정답
      setStats(prev => ({
        ...prev,
        correctAttempts: prev.correctAttempts + 1
      }));

      if (currentJamoIndex + 1 >= currentJamos.length) {
        completeWord();
      } else {
        setCurrentJamoIndex(prev => prev + 1);
      }
    } else {
      // 오답
      setWrongKeyAttempts(prev => prev + 1);
      setShowError(true);
      setTimeout(() => setShowError(false), 500);
    }
  }, [currentJamos, currentJamoIndex, words, isCompleted, useMobileKeyboard, completeWord, saveToLocalStorage]);

  const handleMobileInput = useCallback((event) => {
    const value = event.target.value;
    const typedJamos = disassembleHangul(value);
    const isPrefix = typedJamos.length <= currentJamos.length
      && typedJamos.every((jamo, i) => jamo === currentJamos[i]);

    if (!isPrefix) {
      setShowError(true);
      setTimeout(() => setShowError(false), 500);
      setWrongKeyAttempts(prev => prev + 1);
      setStats(prev => ({
        ...prev,
        totalAttempts: prev.totalAttempts + 1
      }));
      setMobileInput('');
      mobileJamoCountRef.current = 0;
      setCurrentJamoIndex(0);
      if (mobileInputRef.current) {
        mobileInputRef.current.value = '';
      }
      return;
    }

    const prevCount = mobileJamoCountRef.current;
    if (typedJamos.length > prevCount) {
      const delta = typedJamos.length - prevCount;
      setStats(prev => ({
        totalAttempts: prev.totalAttempts + delta,
        correctAttempts: prev.correctAttempts + delta
      }));
    }

    mobileJamoCountRef.current = typedJamos.length;
    setMobileInput(value);
    setCurrentJamoIndex(typedJamos.length);

    if (typedJamos.length === currentJamos.length) {
      setMobileInput('');
      mobileJamoCountRef.current = 0;
      if (mobileInputRef.current) {
        mobileInputRef.current.value = '';
      }
      completeWord();
    }
  }, [currentJamos, completeWord]);

  useEffect(() => {
    if (useMobileKeyboard) return;
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress, useMobileKeyboard]);

  // 완료 시 localStorage 자동 저장
  useEffect(() => {
    if (isCompleted && curriculum && completedWords.length > 0) {
      // 틀린 단어가 없으면 완료로 표시
      const allCompleted = mistakeWords.length === 0;
      saveToLocalStorage(allCompleted);
    }
  }, [isCompleted, curriculum, completedWords, mistakeWords, saveToLocalStorage]);

  // 커리큘럼 선택 핸들러
  const handleCurriculumSelect = (selectedCurriculum) => {
    console.log('handleCurriculumSelect called with:', selectedCurriculum);
    setCurriculum(selectedCurriculum);
  };

  // 다시 시작
  const restart = () => {
    fetchWords(curriculum).then(data => {
      setWords(data);
      setCurrentWordIndex(0);
      setCurrentJamoIndex(0);
      setIsCompleted(false);
      setCompletedWords([]);
      setMistakeWords([]);
      setStats({ totalAttempts: 0, correctAttempts: 0 });
      // localStorage 초기화
      if (curriculum) {
        localStorage.removeItem(`korean-typing-progress-${curriculum}`);
      }
    });
  };

  // 커리큘럼 다시 선택
  const changeCurriculum = () => {
    setCurriculum('');
    setWords([]);
    setCurrentWordIndex(0);
    setCurrentJamoIndex(0);
    setIsCompleted(false);
    setCompletedWords([]);
    setMistakeWords([]);
    setStats({ totalAttempts: 0, correctAttempts: 0 });
  };

  // 틀린 단어만 다시
  const retryMistakes = () => {
    const mistakeWordObjects = words.filter(w => mistakeWords.includes(w.korean));
    setWords(mistakeWordObjects);
    setCurrentWordIndex(0);
    setCurrentJamoIndex(0);
    setIsCompleted(false);
    // completedWords는 유지 (중요!)
    setStats({ totalAttempts: 0, correctAttempts: 0 });
    // mistakeWords는 현재 세션용으로만 초기화
    const currentMistakes = [...mistakeWords];
    setMistakeWords(currentMistakes);
  };

  // 커리큘럼 선택 화면
  if (!curriculum) {
    return <CurriculumSelection
      onSelect={handleCurriculumSelect}
      student={student}
      curriculums={curriculums}
      loading={curriculumsLoading}
    />;
  }

  // 로딩 화면
  if (words.length === 0) {
    return (
      <div className="app-shell">
        <div className="card-panel panel-soft loading-card reveal">
          <div className="text-lg font-semibold">Loading...</div>
          <div className="text-muted text-sm mt-2">Fetching your words</div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    const accuracy = stats.totalAttempts > 0
      ? ((stats.correctAttempts / stats.totalAttempts) * 100).toFixed(1)
      : 0;

    // 다음 커리큘럼 추천
    const currentCurriculumObj = curriculums.find(c => c.id === curriculum);
    const currentIndex = curriculums.findIndex(c => c.id === curriculum);
    const nextCurriculum = currentIndex >= 0 && currentIndex < curriculums.length - 1
      ? curriculums[currentIndex + 1]
      : null;

    const allCorrect = mistakeWords.length === 0;

    return (
      <div className="app-shell">
        <div className="card-panel result-card reveal">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">{allCorrect ? '🎉' : '👏'}</div>
            <h1 className="result-title">{allCorrect ? 'Perfect!' : 'Complete!'}</h1>
            {currentCurriculumObj && (
              <p className="text-muted text-base">
                {currentCurriculumObj.icon} {currentCurriculumObj.name} Curriculum
              </p>
            )}
            {student && (
              <p className="text-muted text-sm mt-1">{student}</p>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <div className="stat-card">
              <span>Completed Words</span>
              <strong>{words.length}</strong>
            </div>
            <div className="stat-card accent">
              <span>Accuracy</span>
              <strong>{accuracy}%</strong>
            </div>
            <div className="stat-card danger">
              <span>Incorrect Words</span>
              <strong>{mistakeWords.length}</strong>
            </div>
          </div>

          {mistakeWords.length > 0 && (
            <div className="sub-panel mb-8">
              <h3 className="text-sm font-semibold mb-3">Incorrect Words</h3>
              <div className="flex flex-wrap gap-2">
                {mistakeWords.map((word, i) => (
                  <span key={i} className="tag-danger">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {mistakeWords.length > 0 && (
              <button
                onClick={retryMistakes}
                className="w-full btn-warning"
              >
                Retry Incorrect Words
              </button>
            )}
            {nextCurriculum && allCorrect && (
              <button
                onClick={() => {
                  setCurriculum(nextCurriculum.id);
                  setIsCompleted(false);
                  setCurrentWordIndex(0);
                }}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <span>Next: {nextCurriculum.icon} {nextCurriculum.name}</span>
                <span>→</span>
              </button>
            )}
            <button
              onClick={restart}
              className="w-full btn-secondary"
            >
              Start Over
            </button>
            <button
              onClick={changeCurriculum}
              className="w-full btn-ghost"
            >
              Select Curriculum
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = words[currentWordIndex];
  const currentKey = currentJamos[currentJamoIndex]
    ? jamoToKey[currentJamos[currentJamoIndex]]
    : '';
  const progress = ((currentWordIndex + (currentJamoIndex / currentJamos.length)) / words.length) * 100;

  const currentCurriculum = curriculums.find(c => c.id === curriculum);

  return (
    <div className="app-shell">
      <div className="w-full max-w-5xl space-y-8">
        {/* 헤더 */}
        <div className="progress-shell reveal">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <button
              onClick={changeCurriculum}
              className="btn-ghost flex items-center gap-2"
            >
              <span className="text-xl">←</span>
              <span className="text-sm">Back</span>
            </button>

            <div className="progress-title">
              {currentCurriculum && (
                <span className="mr-2">
                  {currentCurriculum.icon} {currentCurriculum.name}
                </span>
              )}
              {student && <span className="mr-2">| {student}</span>}
            </div>

            <div className="pill">
              Word {currentWordIndex + 1} / {words.length}
            </div>
          </div>

          <div className="progress-track">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 자모 분해 표시 */}
        <div className="card-panel panel-soft typing-card reveal">

          <div className={`word-display ${showError ? 'is-error' : ''}`}>
            {currentWord.korean}
          </div>

          <div className={`translation-swap ${showError ? 'show-error' : ''}`}>
            <div className="word-translation">
              {currentWord.english}
              <span className="category">[{currentWord.category}]</span>
            </div>
            <div className="error-inline">✗ Incorrect</div>
          </div>

          <div className="jamo-row hint">
            {currentJamos.map((jamo, i) => (
              <span
                key={i}
                className={`jamo-chip ${
                  i === currentJamoIndex
                    ? 'is-current'
                    : i < currentJamoIndex
                    ? 'is-done'
                    : ''
                }`}
              >
                {jamo}
              </span>
            ))}
          </div>
        </div>

        {useMobileKeyboard ? (
          <div className="mobile-input-wrap reveal">
            <input
              ref={mobileInputRef}
              className="mobile-input"
              value={mobileInput}
              onChange={handleMobileInput}
              placeholder="Tap to type in Korean"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              inputMode="text"
            />
            <div className="mobile-input-hint">Use your phone keyboard to type</div>
          </div>
        ) : (
          <div className="keyboard-wrap reveal">
            <Keyboard currentKey={currentKey} isMobile={false} />
          </div>
        )}

        <div className="stats-footer">
          Accuracy: {stats.totalAttempts > 0
            ? ((stats.correctAttempts / stats.totalAttempts) * 100).toFixed(1)
            : 0}%
          {' | '}
          Keystrokes: {stats.totalAttempts}
        </div>
      </div>
    </div>
  );
}

export default App;
