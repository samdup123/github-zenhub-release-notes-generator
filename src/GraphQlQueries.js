const graphQlFetch = require("./graphQlFetch");
const queryStrings = require("./queryStrings");

const zenhubUrl = "https://api.zenhub.com/public/graphql";
const githubUrl = "https://api.github.com/graphql";

module.exports = (githubApiToken) => {
  return {
    githubTagsQuery: async (variables) => {
      return graphQlFetch(
        githubUrl,
        githubApiToken,
        queryStrings.tags,
        variables,
      );
    },
    githubCommitsAfterTimeQuery: async (variables) => {
      const branchName = variables.branchName;
      delete variables.branchName;
      return graphQlFetch(
        githubUrl,
        githubApiToken,
        queryStrings.commitsAfterTime(branchName),
        variables,
      );
    },
    githubIssuesQuery: function (organization, projectNumber) {
      return async function (variables) {
        variables.organization = organization;
        variables.projectNumber = projectNumber;

        return graphQlFetch(
          githubUrl,
          githubApiToken,
          require("./queryStrings/githubIssues"),
          variables,
        );
      };
    },
  };
};
