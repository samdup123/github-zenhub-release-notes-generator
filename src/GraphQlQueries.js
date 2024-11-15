const graphQlFetch = require("./graphQlFetch");
const queryStrings = require("./queryStrings");

const zenhubUrl = "https://api.zenhub.com/public/graphql";
const githubUrl = "https://api.github.com/graphql";

module.exports = (githubApiToken, zenhubApiToken) => {
  return {
    githubTagsQuery: async (variables) => {
      return graphQlFetch(
        githubUrl,
        githubApiToken,
        queryStrings.tags,
        variables
      );
    },
    githubCommitsAfterTimeQuery: async (variables) => {
      const branchName = variables.branchName;
      delete variables.branchName;
      return graphQlFetch(
        githubUrl,
        githubApiToken,
        queryStrings.commitsAfterTime(branchName),
        variables
      );
    },
    zenhubEpicIssuesQuery: async (variables) => {
      return graphQlFetch(
        zenhubUrl,
        zenhubApiToken,
        queryStrings.epicIssues,
        variables
      );
    },
  };
};
