const graphQlFetch = async (graphqlUrl, apiToken, query, variables) => {
  const data = await fetch(graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ query, variables }),
  }).then((response) => response.json());

  if (data.errors) {
    console.error("ERROR");
    console.error(data.errors);
    console.error("\nGRAPHQL QUERY");
    console.error(query);
    console.error("\nGRAPHQL VARIABLES");
    console.error(variables);
    process.exit(1);
  }

  return data.data;
};
module.exports = graphQlFetch;
