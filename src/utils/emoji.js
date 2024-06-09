exports.gradeToEmoji = (grade) => {
    const gradeEmojis = {
      'A': '🟢',
      'B': '🟢',
      'C': '🟡',
      'D': '🟠',
      'E': '🔴'
    };
    return gradeEmojis[grade.toUpperCase()] || '';
  }
  
