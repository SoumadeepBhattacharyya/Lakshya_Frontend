const generateAISuggestions = (jobs) => {
  const roleCount = {};
  const companyCount = {};
  const typeCount = {};

  jobs.forEach(job => {
    const { position, company, jobType } = job;

    // Count position frequency
    const roleKey = position.toLowerCase();
    roleCount[roleKey] = (roleCount[roleKey] || 0) + 1;

    // Count company frequency
    const companyKey = company.toLowerCase();
    companyCount[companyKey] = (companyCount[companyKey] || 0) + 1;

    // Count job type
    typeCount[jobType] = (typeCount[jobType] || 0) + 1;
  });

  // Generate simple suggestions
  const mostCommonRole = Object.entries(roleCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostCommonType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  const suggestions = [];

  if (mostCommonRole) {
    suggestions.push(`You frequently applied for '${mostCommonRole}'. Consider similar roles like "${mostCommonRole} Intern", "Junior ${mostCommonRole}", or freelance work.`);
  }

  if (mostCommonType === 'remote') {
    suggestions.push('You prefer remote jobs. Explore platforms like RemoteOK, WeWorkRemotely, or AngelList.');
  } else if (mostCommonType === 'internship') {
    suggestions.push('Since you apply for internships, check Internshala, LinkedIn internships, and early-career roles.');
  }

  suggestions.push('Keep applying consistently and tracking your application status. Consider updating resumes for top roles.');

  return suggestions;
};

export { generateAISuggestions };