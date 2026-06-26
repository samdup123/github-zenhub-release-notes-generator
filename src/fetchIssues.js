const graphQlFetch = require("./graphQlFetch");
const queryStrings = require("./queryStrings");

const githubUrl = "https://api.github.com/graphql";
const defaultIssueRetrievalCount = 100;

async function fetchIssues(repoOwner, repoName, githubApiToken) {
  const issues = {};
  let issueCursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await graphQlFetch(
      githubUrl,
      githubApiToken,
      queryStrings.issues,
      {
        repoOwner,
        repoName,
        issueRetrievalCount: defaultIssueRetrievalCount,
        issueCursor,
      }
    );

    const issueConnection = data.repository?.issues;
    const nodes = issueConnection?.nodes || [];

    nodes.forEach((issue) => {
      issues[issue.number] = issue;
    });

    hasNextPage = issueConnection?.pageInfo?.hasNextPage || false;
    issueCursor = hasNextPage ? issueConnection.pageInfo.endCursor : null;
  }

  return issues;
}

module.exports = fetchIssues;
