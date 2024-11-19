module.exports = (issues, repositoryName) => {
  const prs = {};

  for (const issueNumber in issues) {
    const issue = issues[issueNumber];

    if (issue.connectedPrs.nodes.length > 0) {
      issue.connectedPrs.nodes.forEach((pr) => {
        if (pr.repository.name === issue.repository.name) {
          if (!prs[pr.number]) {
            prs[pr.number] = [];
          }
          if (!prs[pr.number].includes(issueNumber)) {
            prs[pr.number].push(issue.number);
          }
        }
      });
    }
  }
  return prs;
};
