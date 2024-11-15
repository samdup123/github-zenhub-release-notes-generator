const graphQlFetch = async (graphqlUrl, apiToken, query, variables) => {
  return fetch(graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Graphql-Features": "sub_issues",
      "Authorization": `Bearer ${apiToken}`
    },
    body: JSON.stringify({ query, variables }),
  }).then(response => response.json());
};
module.exports = graphQlFetch;
