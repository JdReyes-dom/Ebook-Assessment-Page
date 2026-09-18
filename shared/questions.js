/* ==========================================================================
   FRS GENERAL KNOWLEDGE QUIZ — QUESTION BANK
   Digital Values | 10 Questions
   ========================================================================== */

const QUIZ_QUESTIONS = [
  {
    id: 1,
    grade: 'Digital Values',
    subject: 'Online Safety',
    question: 'Your friends invite you to try a dangerous online challenge. They say, "Everyone is doing it!" What should you do?',
    choices: {
      a: 'Join because you do not want to be left out.',
      b: 'Try it first and stop if something goes wrong.',
      c: 'Think about the possible risks before deciding.',
      d: 'Share it with others so they can try it too.'
    },
    correct: 'c'
  },
  {
    id: 2,
    grade: 'Digital Values',
    subject: 'Digital Balance',
    question: 'You have been playing games on your tablet all afternoon. You still need to eat dinner, take a bath, and finish your homework. What should you do?',
    choices: {
      a: 'Take care of your responsibilities before returning to the game.',
      b: 'Ask someone else to finish your homework.',
      c: 'Continue playing until you finish your game.',
      d: 'Skip dinner and your bath so you can finish everything faster.'
    },
    correct: 'a'
  },
  {
    id: 3,
    grade: 'Digital Values',
    subject: 'Smart Consumerism',
    question: 'Many of your classmates are buying a new gadget because it is popular online. You already have one that works well. What should you consider before buying it?',
    choices: {
      a: 'Whether everyone else has it.',
      b: 'Whether the advertisement makes it look exciting.',
      c: 'Whether your friends will think it is cool.',
      d: 'Whether you actually need it and whether it fits your family\'s budget.'
    },
    correct: 'd'
  },
  {
    id: 4,
    grade: 'Digital Values',
    subject: 'Information Literacy',
    question: 'You find a website with information for your school project, but you cannot find who wrote it or where the information came from. What should you do?',
    choices: {
      a: 'Use it because it appears on the internet.',
      b: 'Look for information from reliable sources and compare the information.',
      c: 'Use it because the website looks professional.',
      d: 'Copy the information before the website disappears.'
    },
    correct: 'b'
  },
  {
    id: 5,
    grade: 'Digital Values',
    subject: 'Time Management',
    question: 'You are working on an assignment when your friend sends you a funny video. You want to watch it, but your assignment is due tomorrow. What is a responsible choice?',
    choices: {
      a: 'Finish your important work first, then enjoy some entertainment.',
      b: 'Watch videos first and work on the assignment later.',
      c: 'Ignore the assignment completely.',
      d: 'Stay up all night playing and finish the assignment quickly in the morning.'
    },
    correct: 'a'
  },
  {
    id: 6,
    grade: 'Digital Values',
    subject: 'Financial Responsibility',
    question: 'You want to buy a pair of shoes you saw in an online advertisement. They are on sale, but your family is currently saving money for something important. What should you do?',
    choices: {
      a: 'Buy them because they are on sale.',
      b: 'Ask your friends to convince your family.',
      c: 'Buy them secretly so you do not miss the sale.',
      d: 'Ask your parents or guardian and consider whether they are a need or a want.'
    },
    correct: 'd'
  },
  {
    id: 7,
    grade: 'Digital Values',
    subject: 'Digital Organization',
    question: 'Your computer has hundreds of downloaded files, pictures, and school assignments. You cannot find an important project. What would help prevent this problem?',
    choices: {
      a: 'Save everything on the desktop.',
      b: 'Organize files into folders and use clear names.',
      c: 'Delete files whenever you need space.',
      d: 'Download another copy of every file.'
    },
    correct: 'b'
  },
  {
    id: 8,
    grade: 'Digital Values',
    subject: 'Privacy & Safety',
    question: 'Before posting a picture online, you notice that your school ID and location can be seen. A friend says, "Just post it. It\'s fine!" What should you do?',
    choices: {
      a: 'Post it because your friend said it is okay.',
      b: 'Share it only with people you know online.',
      c: 'Remove or hide the private information before posting.',
      d: 'Add your address so people know where the picture was taken.'
    },
    correct: 'c'
  },
  {
    id: 9,
    grade: 'Digital Values',
    subject: 'Responsible AI Use',
    question: 'You are having trouble with a school assignment, so you ask an AI tool to make the entire answer for you. What would be a better way to use AI?',
    choices: {
      a: 'Submit the AI\'s answer without reading it.',
      b: 'Copy the answer and tell your teacher that you wrote it yourself.',
      c: 'Ask AI to complete every assignment you receive.',
      d: 'Use AI to help explain ideas, then do your own work and make sure you understand it.'
    },
    correct: 'd'
  },
  {
    id: 10,
    grade: 'Digital Values',
    subject: 'Digital Citizenship',
    question: 'You see a group chat where students are making fun of a classmate and sharing an embarrassing picture. What should you do?',
    choices: {
      a: 'Avoid participating, report the harmful behavior, and tell a trusted adult.',
      b: 'Share the picture with another group.',
      c: 'Ignore it because it does not involve you.',
      d: 'Join the jokes so you can be part of the group.'
    },
    correct: 'a'
  }
];

/* Utility: get questions filtered by grade range (inclusive) */
function getQuestionsForGrades(minGrade, maxGrade) {
  return QUIZ_QUESTIONS.filter(
    q => q.grade >= minGrade && q.grade <= maxGrade
  );
}

/* Utility: find a question by id */
function getQuestionById(id) {
  return QUIZ_QUESTIONS.find(q => q.id === id) || null;
}

/* Utility: check if an answer is correct */
function isAnswerCorrect(questionId, answerKey) {
  const q = getQuestionById(questionId);
  if (!q || !answerKey) return false;
  return q.correct === answerKey.toLowerCase();
}

/* Export for use in other scripts (global scope) */
window.QUIZ_QUESTIONS = QUIZ_QUESTIONS;
window.getQuestionsForGrades = getQuestionsForGrades;
window.getQuestionById = getQuestionById;
window.isAnswerCorrect = isAnswerCorrect;