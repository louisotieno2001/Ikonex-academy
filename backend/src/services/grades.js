const { getItems } = require('./directus.service');

let cachedScales = null;

async function getGradingScales() {
  if (!cachedScales) {
    const result = await getItems('grading_scale', {
      'filter[isActive][_eq]': true,
      sort: '-gradePoint',
    });
    cachedScales = result.data || [];
  }
  return cachedScales;
}

function invalidateScaleCache() {
  cachedScales = null;
}

function determineGrade(score, maxScore, scales) {
  const percentage = (score / maxScore) * 100;
  for (const scale of scales) {
    if (percentage >= scale.lowerBound && percentage <= scale.upperBound) {
      return { grade: scale.grade, gradePoint: scale.gradePoint, label: scale.label || '' };
    }
  }
  return { grade: 'F', gradePoint: 0, label: 'Fail' };
}

function calculatePosition(scores) {
  const sorted = [...scores].sort((a, b) => b.total - a.total);
  const positions = new Map();
  let currentPos = 1;
  let prevScore = -1;
  sorted.forEach((s, i) => {
    if (s.total !== prevScore) {
      currentPos = i + 1;
      prevScore = s.total;
    }
    positions.set(s.studentId, currentPos);
  });
  return positions;
}

module.exports = { getGradingScales, invalidateScaleCache, determineGrade, calculatePosition };
