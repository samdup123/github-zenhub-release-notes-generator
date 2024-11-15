const GraphQlQueries = require("./GraphQlQueries");

module.exports = async (
  repoOwner,
  repoName,
  branchName,
  startDate,
  githubApiToken
) => {
  const graphQlQueries = GraphQlQueries(githubApiToken);

  let hasNextPage = true;
  let commitCursor;
  let commits = [];

  // TODO: make this stop when it gets a commit that is newer than the release date

  while (hasNextPage) {
    let data = await graphQlQueries.githubCommitsAfterTimeQuery({
      repoOwner,
      repoName,
      branchName,
      since: startDate,
      commitCursor,
    });

    data = data.data.repository.ref.target.history;
    const pageInfo = data.pageInfo;
    hasNextPage = pageInfo.hasNextPage;
    commitCursor = pageInfo.endCursor;
    commits = commits.concat(data.nodes);
  }

  return commits;
};
