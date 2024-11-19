const GraphQlQueries = require("./GraphQlQueries");

const defaultTagCount = 55;

module.exports = async (repoOwner, repoName, githubApiToken) => {
  const graphQlQueries = GraphQlQueries(githubApiToken);

  let hasNextPage = true;
  let tagCursor = "";
  let tags = [];
  while (hasNextPage) {
    let data = await graphQlQueries.githubTagsQuery({
      repoOwner,
      repoName,
      tagCount: defaultTagCount,
      tagCursor,
    });
    tags = tags.concat(data.repository.refs.nodes);
    const pageInfo = data.repository.refs.pageInfo;
    hasNextPage = pageInfo.hasNextPage;
    tagCursor = pageInfo.endCursor;
  }

  return tags;
};
