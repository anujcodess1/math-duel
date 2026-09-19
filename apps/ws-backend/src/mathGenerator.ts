export interface QuestionPayload {
  id: string;
  text: string;
  options: number[];
  timeLimit: number;
}

export interface InternalQuestion extends QuestionPayload {
  correctAnswer: number;
}

const SIGNS = ["+", "-", "*", "/"] as const;

export function generateQuestion(): InternalQuestion {
  const id = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sign = SIGNS[Math.floor(Math.random() * SIGNS.length)];

  let num1 = 0;
  let num2 = 0;
  let correctAnswer = 0;

  switch (sign) {
    case "+": {
      num1 = Math.floor(Math.random() * 80) + 10;
      num2 = Math.floor(Math.random() * 80) + 10;
      correctAnswer = num1 + num2;
      break;
    }
    case "-": {
      num1 = Math.floor(Math.random() * 80) + 20;
      num2 = Math.floor(Math.random() * (num1 - 10)) + 5;
      correctAnswer = num1 - num2;
      break;
    }
    case "*": {
      num1 = Math.floor(Math.random() * 12) + 3;
      num2 = Math.floor(Math.random() * 12) + 2;
      correctAnswer = num1 * num2;
      break;
    }
    case "/": {
      const divisor = Math.floor(Math.random() * 10) + 2;
      const quotient = Math.floor(Math.random() * 12) + 2;
      num1 = divisor * quotient;
      num2 = divisor;
      correctAnswer = quotient;
      break;
    }
  }

  const wrongOptions = new Set<number>();
  const deltas = [-10, 10, -1, 1, -2, 2, -5, 5, -3, 3, -4, 4];
  const shuffledDeltas = [...deltas].sort(() => Math.random() - 0.5);

  for (const d of shuffledDeltas) {
    const candidate = correctAnswer + d;
    if (candidate !== correctAnswer && candidate >= 0) {
      wrongOptions.add(candidate);
    }
    if (wrongOptions.size === 3) break;
  }

  while (wrongOptions.size < 3) {
    const randomOffset = Math.floor(Math.random() * 14) - 7;
    const candidate = correctAnswer + randomOffset;
    if (candidate !== correctAnswer && candidate >= 0) {
      wrongOptions.add(candidate);
    }
  }

  const options = Array.from(wrongOptions);
  options.push(correctAnswer);
  options.sort(() => Math.random() - 0.5);

  const displaySign = sign === "*" ? "×" : sign === "/" ? "÷" : sign;

  return {
    id,
    text: `${num1} ${displaySign} ${num2}`,
    options,
    correctAnswer,
    timeLimit: 5,
  };
}
