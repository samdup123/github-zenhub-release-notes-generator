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

const epicIssues = `
  query epicsFromWorkspace($workspaceId: ID!, $epicIds: [ID!], $epicRetrievalCount: Int, $epicCursor: String, $issueRetrievalCount: Int, $issueCursor: String){
    workspace(id: $workspaceId) {
      epics(first: $epicRetrievalCount, after: $epicCursor, ids: $epicIds) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          issue {
            number
            title
            repository {
              name
            }
            state
            releases {
              nodes {
                id
              }
            }
          }
          childIssues(first: $issueRetrievalCount, after: $issueCursor) {
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
              pullRequest
              connectedPrs(first: 5) {
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
    }
  }
`;

module.exports = { tags, commitsAfterTime, epicIssues };
