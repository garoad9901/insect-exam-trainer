const answers = [
  3,2,1,2,2,1,2,3,1,4,1,3,3,4,3,1,2,4,2,1,4,1,3,2,1,4,2,1,4,4,2,3,3,1,
  4,3,2,3,1,1,3,2,3,4,2,1,3,2,3,4,4,4,1,3,2,3,3,1,4,1,2,1,2,3,1,1,4,1,
  3,1,2,3,2,4,2,1,4,2,1,2,3,4,2,3,4,3,3,4,4,2,1,3,2,2,1,3,2,1,2,1,4,3
];

window.INSECT_LEVELS = {
  beginner: {
    id: 'beginner',
    label: '初級',
    questionCount: 102,
    questions: answers.map((answer, index) => ({
      id: index + 1,
      answer,
      questionImage: `assets/questions/${String(index + 1).padStart(3, '0')}.jpg`,
      answerImage: `assets/answers/${String(index + 1).padStart(3, '0')}.jpg`,
    })),
  },
  intermediate: {
    id: 'intermediate',
    label: '中級',
    questionCount: 0,
    questions: [],
    status: 'coming-soon',
  },
};
