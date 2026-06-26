const tags = `
query ($repoOwner: String!, $repoName: String!, $tagCount: Int!, $tagCursor: String) {
  repository(owner: $repoOwner, name: $repoName) {
    refs(refPrefix: "refs/tags/", first: $tagCount, after: $tagCursor) {
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        name
        id
        target {
	  ... on Commit {
            author {
              name
              date
            }
      	  }
    	}
      }
    }
  }
}`;

const commitsAfterTime = (branchName) => `
query ($repoOwner: String!, $repoName: String!, $since: GitTimestamp!, $commitCursor: String) {
  repository(owner: $repoOwner, name: $repoName) {
    ref(qualifiedName: "refs/heads/${branchName}") {
      target {
        ... on Commit {
           history(since: $since, after: $commitCursor) {
            pageInfo {
              endCursor
              hasNextPage
            }
            nodes {
              associatedPullRequests(first:1) {
                nodes {
                  number
                  title
                }
              }
              committedDate
              author {
                name
                user {
                  login
                }
              }
            }
          }
        }
      }
    }
  }
}`;

const issues = `
query (
  $repoOwner: String!
  $repoName: String!
  $issueRetrievalCount: Int!
  $issueCursor: String
) {
  repository(owner: $repoOwner, name: $repoName) {
    issues(
      first: $issueRetrievalCount
      after: $issueCursor
      states: [OPEN, CLOSED]
      orderBy: { field: CREATED_AT, direction: DESC }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        title
        number
        repository {
          name
        }
        connectedPrs: closedByPullRequestsReferences(first: 20) {
          nodes {
            number
            title
            repository {
              name
            }
          }
        }
      }
    }
  }
}
`;

module.exports = { tags, commitsAfterTime, issues };
