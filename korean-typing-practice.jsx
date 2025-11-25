import React, { useState, useEffect, useCallback } from 'react';

// Airtable 설정 (나중에 입력 가능하게 수정)
const USE_MOCK_DATA = true;
const AIRTABLE_BASE_ID = 'YOUR_BASE_ID';
const AIRTABLE_TABLE_NAME = 'YOUR_TABLE_NAME';
const AIRTABLE_TOKEN = 'YOUR_TOKEN';

// 목업 데이터
const MOCK_WORDS = [
  { korean: '호수', english: 'lake', level: 'beginner1', category: 'noun' },
  { korean: '사랑', english: 'love', level: 'beginner1', category: 'noun' },
  { korean: '먹다', english: 'to eat', level: 'beginner1', category: 'verb' },
  { korean: '예쁘다', english: 'pretty', level: 'beginner1', category: 'adjective' },
  { korean: '학교', english: 'school', level: 'beginner1', category: 'noun' },
  { korean: '친구', english: 'friend', level: 'beginner1', category: 'noun' },
  { korean: '바다', english: 'sea', level: 'beginner1', category: 'noun' },
  { korean: '하늘', english: 'sky', level: 'beginner1', category: 'noun' },
  { korean: '음식', english: 'food', level: 'beginner1', category: 'noun' },
  { korean: '가족', english: 'family', level: 'beginner1', category: 'noun' },
];

// 한글 자모 분해 함수 (es-hangul 대체)
const disassembleHangul = (word) => {
  const HANGUL_START = 0xAC00;
  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  const result = [];

  for (let char of word) {
    const code = char.charCodeAt(0);

    if (code >= HANGUL_START && code <= 0xD7A3) {
      const hangulCode = code - HANGUL_START;
      const choIndex = Math.floor(hangulCode / 588);
      const jungIndex = Math.floor((hangulCode % 588) / 28);
      const jongIndex = hangulCode % 28;

      result.push(CHO[choIndex]);
      result.push(JUNG[jungIndex]);
      if (jongIndex !== 0) {
        result.push(JONG[jongIndex]);
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
  'ㅕ': 'u', 'ㅖ': 'P', 'ㅗ': 'h', 'ㅘ': 'hk', 'ㅙ': 'ho', 'ㅚ': 'hl',
  'ㅛ': 'y', 'ㅜ': 'n', 'ㅝ': 'nj', 'ㅞ': 'np', 'ㅟ': 'nl', 'ㅠ': 'b',
  'ㅡ': 'm', 'ㅢ': 'ml', 'ㅣ': 'l'
};

// Airtable에서 데이터 가져오기
async function fetchWordsByLevel(level) {
  if (USE_MOCK_DATA) {
    return MOCK_WORDS.filter(w => w.level === level);
  }

  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula={레벨}='${level}'`,
    { headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }}
  );
  const data = await response.json();
  return data.records.map(r => ({
    korean: r.fields['한국어'],
    english: r.fields['영어뜻'],
    level: r.fields['레벨'],
    category: r.fields['품사']
  }));
}

// 키보드 컴포넌트
function Keyboard({ currentKey }) {
  const keyLayout = [
    ['ㅂ(q)', 'ㅈ(w)', 'ㄷ(e)', 'ㄱ(r)', 'ㅅ(t)', 'ㅛ(y)', 'ㅕ(u)', 'ㅑ(i)', 'ㅐ(o)', 'ㅔ(p)'],
    ['ㅁ(a)', 'ㄴ(s)', 'ㅇ(d)', 'ㄹ(f)', 'ㅎ(g)', 'ㅗ(h)', 'ㅓ(j)', 'ㅏ(k)', 'ㅣ(l)'],
    ['ㅋ(z)', 'ㅌ(x)', 'ㅊ(c)', 'ㅍ(v)', 'ㅠ(b)', 'ㅜ(n)', 'ㅡ(m)'],
  ];

  const getKeyClass = (key) => {
    const englishKey = key.match(/\(([a-zA-Z])\)/)?.[1];
    const isActive = englishKey && (
      currentKey === englishKey ||
      currentKey.toLowerCase() === englishKey.toLowerCase()
    );

    return `px-3 py-3 rounded border-2 text-sm font-mono transition-all ${
      isActive
        ? 'bg-blue-600 border-blue-400 text-white scale-110 shadow-lg'
        : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
    }`;
  };

  return (
    <div className="flex flex-col gap-2 items-center">
      {keyLayout.map((row, i) => (
        <div key={i} className="flex gap-2">
          {row.map((key) => (
            <div key={key} className={getKeyClass(key)}>
              {key.split('(')[0]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// 메인 앱 컴포넌트
export default function KoreanTypingPractice() {
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentJamoIndex, setCurrentJamoIndex] = useState(0);
  const [currentJamos, setCurrentJamos] = useState([]);
  const [completedWords, setCompletedWords] = useState([]);
  const [mistakeWords, setMistakeWords] = useState([]);
  const [stats, setStats] = useState({ totalAttempts: 0, correctAttempts: 0 });
  const [isCompleted, setIsCompleted] = useState(false);
  const [level, setLevel] = useState('beginner1');
  const [student, setStudent] = useState('');
  const [wrongKeyAttempts, setWrongKeyAttempts] = useState(0);

  // URL 파라미터에서 레벨과 학생 이름 가져오기
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLevel = params.get('level');
    const urlStudent = params.get('student');

    if (urlLevel) setLevel(urlLevel);
    if (urlStudent) setStudent(urlStudent);

    // localStorage에서 데이터 로드
    const saved = localStorage.getItem('korean-typing-stats');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCompletedWords(data.completedWords || []);
        setStats(data.stats || { totalAttempts: 0, correctAttempts: 0 });
        setMistakeWords(data.mistakeWords || []);
        // 현재 진행 상태도 복원
        if (data.currentWordIndex !== undefined) {
          setCurrentWordIndex(data.currentWordIndex);
        }
      } catch (e) {
        console.error('localStorage parse error:', e);
      }
    }
  }, []);

  // 단어 데이터 로드
  useEffect(() => {
    fetchWordsByLevel(level).then(setWords);
  }, [level]);

  // 현재 단어의 자모 분해
  useEffect(() => {
    if (words.length > 0 && currentWordIndex < words.length) {
      const word = words[currentWordIndex];
      const jamos = disassembleHangul(word.korean);
      setCurrentJamos(jamos);
      setCurrentJamoIndex(0);
      setWrongKeyAttempts(0);
    }
  }, [words, currentWordIndex]);

  // localStorage에 자동 저장 (진행 상태가 변경될 때마다)
  useEffect(() => {
    if (completedWords.length > 0 || currentWordIndex > 0) {
      const data = {
        completedWords,
        stats,
        mistakeWords,
        currentWordIndex
      };
      localStorage.setItem('korean-typing-stats', JSON.stringify(data));
    }
  }, [completedWords, stats, mistakeWords, currentWordIndex]);

  // 키 입력 처리
  const handleKeyPress = useCallback((event) => {
    if (isCompleted || words.length === 0) return;

    const currentJamo = currentJamos[currentJamoIndex];
    const expectedKey = jamoToKey[currentJamo];
    const pressedKey = event.key;

    // 특수 키 무시
    if (['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'Escape'].includes(pressedKey)) {
      return;
    }

    setStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1
    }));

    // 대소문자 구분하여 매칭
    const isMatch = pressedKey === expectedKey ||
                     pressedKey.toLowerCase() === expectedKey.toLowerCase() ||
                     (expectedKey && expectedKey.includes(pressedKey));

    if (isMatch) {
      // 정답
      setStats(prev => ({
        ...prev,
        correctAttempts: prev.correctAttempts + 1
      }));

      if (currentJamoIndex + 1 >= currentJamos.length) {
        // 단어 완성
        const currentWord = words[currentWordIndex];
        setCompletedWords(prev => [...prev, currentWord.korean]);

        // 틀린 횟수가 있으면 실수 단어에 추가
        if (wrongKeyAttempts > 0) {
          setMistakeWords(prev => {
            if (!prev.includes(currentWord.korean)) {
              return [...prev, currentWord.korean];
            }
            return prev;
          });
        }

        if (currentWordIndex + 1 >= words.length) {
          // 모든 단어 완료
          setIsCompleted(true);
        } else {
          // 다음 단어로
          setTimeout(() => {
            setCurrentWordIndex(prev => prev + 1);
          }, 300);
        }
      } else {
        // 다음 자모로
        setCurrentJamoIndex(prev => prev + 1);
      }
    } else {
      // 오답
      setWrongKeyAttempts(prev => prev + 1);
    }
  }, [currentJamos, currentJamoIndex, words, currentWordIndex, isCompleted, wrongKeyAttempts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // 다시 시작
  const restart = () => {
    fetchWordsByLevel(level).then(data => {
      setWords(data);
      setCurrentWordIndex(0);
      setCurrentJamoIndex(0);
      setIsCompleted(false);
      setCompletedWords([]);
      setMistakeWords([]);
      setStats({ totalAttempts: 0, correctAttempts: 0 });
      // localStorage 초기화
      localStorage.removeItem('korean-typing-stats');
    });
  };

  // 틀린 단어만 다시
  const retryMistakes = () => {
    const mistakeWordObjects = words.filter(w => mistakeWords.includes(w.korean));
    setWords(mistakeWordObjects);
    setCurrentWordIndex(0);
    setCurrentJamoIndex(0);
    setIsCompleted(false);
    setCompletedWords([]);
    setMistakeWords([]);
    setStats({ totalAttempts: 0, correctAttempts: 0 });
    // localStorage 초기화
    localStorage.removeItem('korean-typing-stats');
  };

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  if (isCompleted) {
    const accuracy = stats.totalAttempts > 0
      ? ((stats.correctAttempts / stats.totalAttempts) * 100).toFixed(1)
      : 0;

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            완료!
          </h1>

          {student && (
            <p className="text-gray-400 text-center mb-4">학생: {student}</p>
          )}

          <div className="space-y-4 text-white">
            <div className="flex justify-between">
              <span>총 단어:</span>
              <span className="font-bold">{completedWords.length}개</span>
            </div>
            <div className="flex justify-between">
              <span>정확도:</span>
              <span className="font-bold text-blue-400">{accuracy}%</span>
            </div>
            <div className="flex justify-between">
              <span>틀린 단어:</span>
              <span className="font-bold text-red-400">{mistakeWords.length}개</span>
            </div>
          </div>

          {mistakeWords.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white font-bold mb-2">틀린 단어 목록:</h3>
              <div className="flex flex-wrap gap-2">
                {mistakeWords.map((word, i) => (
                  <span key={i} className="bg-red-900 text-white px-3 py-1 rounded">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 space-y-3">
            {mistakeWords.length > 0 && (
              <button
                onClick={retryMistakes}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition"
              >
                틀린 단어만 다시
              </button>
            )}
            <button
              onClick={restart}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              처음부터 다시
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
  // 완료된 단어 개수 기준으로 진행률 계산 (현재 진행 중인 단어의 자모 진행도 포함)
  const currentWordProgress = currentJamos.length > 0 ? currentJamoIndex / currentJamos.length : 0;
  const progress = ((completedWords.length + currentWordProgress) / words.length) * 100;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-gray-400 text-sm mb-2">
            {student && `${student} | `}
            단어 {currentWordIndex + 1} / {words.length}
          </div>

          {/* 진행바 */}
          <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 자모 분해 표시 */}
        <div className="text-center mb-8">
          <div className="flex justify-center gap-4 mb-6">
            {currentJamos.map((jamo, i) => (
              <span
                key={i}
                className={`text-4xl font-bold transition-all ${
                  i === currentJamoIndex
                    ? 'text-blue-500 scale-125'
                    : i < currentJamoIndex
                    ? 'text-green-500'
                    : 'text-gray-600'
                }`}
              >
                {jamo}
              </span>
            ))}
          </div>

          {/* 완성형 단어 */}
          <div className="text-6xl font-bold text-white mb-4">
            {currentWord.korean}
          </div>

          {/* 영어 뜻과 품사 */}
          <div className="text-2xl text-gray-400">
            {currentWord.english}
            <span className="text-gray-600 ml-2">[{currentWord.category}]</span>
          </div>
        </div>

        {/* 키보드 */}
        <div className="mt-12">
          <Keyboard currentKey={currentKey} />
        </div>

        {/* 통계 */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          정확도: {stats.totalAttempts > 0
            ? ((stats.correctAttempts / stats.totalAttempts) * 100).toFixed(1)
            : 0}%
          {' | '}
          타수: {stats.totalAttempts}
        </div>
      </div>
    </div>
  );
}
