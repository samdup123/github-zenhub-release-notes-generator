const GraphQlQueries = require("./GraphQlQueries");

const defaultRetrievalCount = 55;

function filterEpicsByRepository(epics, repositoryName) {
  return epics.filter((epic) => {
    return epic.issue.repository.name === repositoryName;
  });
}

function filterEpicsByRelease(epics, releaseId) {
  return epics.filter((epic) => {
    let epicIsPartOfDesiredRelease = false;
    epic.issue.releases.nodes.forEach((release) => {
      if (release.id === releaseId) {
        epicIsPartOfDesiredRelease = true;
        return;
      }
    });
    return epicIsPartOfDesiredRelease;
  });
}

async function fetchEpics(
  zenhubEpicsQuery,
  workspaceId,
  releaseId,
  repositoryName
) {
  async function fetchEpicsByRelease(variables) {
    variables.workspaceId = workspaceId;
    if (!variables.epicRetrievalCount) {
      variables.epicRetrievalCount = defaultRetrievalCount;
    }
    if (!variables.issueRetrievalCount) {
      variables.issueRetrievalCount = defaultRetrievalCount;
    }
    let data = await zenhubEpicsQuery(variables);
    let epics = data.data.workspace.epics.nodes;
    const pageInfo = data.data.workspace.epics.pageInfo;
    epics = filterEpicsByRelease(epics, releaseId);
    epics = filterEpicsByRepository(epics, repositoryName);

    return { epics: { pageInfo, nodes: epics } };
  }

  let epics = [];
  let epicCursor = "";

  do {
    const workspace = await fetchEpicsByRelease({
      epicCursor,
      issueRetrievalCount: 0,
    });
    if (workspace.errors) {
      console.error("ERROR", workspace.errors);
      throw new Error("Error fetching epics");
    }
    epics = epics.concat(workspace.epics.nodes);
    epicCursor = workspace.epics.pageInfo.hasNextPage
      ? workspace.epics.pageInfo.endCursor
      : "";
  } while (epicCursor);

  for (let i = 0; i < epics.length; i++) {
    let epic = epics[i];
    let issueCursor = epic.childIssues.pageInfo.endCursor;

    while (issueCursor) {
      const workspace = await fetchEpicsByRelease({
        epicIds: [epic.id],
        issueCursor,
      });
      if (workspace.errors) {
        console.error("ERROR", workspace.errors);
        throw new Error("Error fetching epics");
      }
      const retrievedEpic = workspace.epics.nodes[0];
      epics[i].childIssues.nodes = epics[i].childIssues.nodes.concat(
        retrievedEpic.childIssues.nodes
      );
      issueCursor = retrievedEpic.childIssues.pageInfo.hasNextPage
        ? retrievedEpic.childIssues.pageInfo.endCursor
        : "";
    }
  }

  return epics;
}

function getIssuesFromEpics(epics, repositoryName) {
  let issues = {};

  epics.forEach((epic) => {
    epic.childIssues.nodes.forEach((issue) => {
      if (!issue.pullRequest && issue.repository.name === repositoryName) {
        issues[issue.number] = issue;
      }
    });
  });

  return issues;
}

async function fetchIssues(
  workspaceId,
  releaseId,
  repositoryName,
  zenhubApiToken
) {
  const graphQlQueries = GraphQlQueries(null, zenhubApiToken);
  const zenhubEpicsQuery = graphQlQueries.zenhubEpicIssuesQuery;

  const epics = await fetchEpics(
    zenhubEpicsQuery,
    workspaceId,
    releaseId,
    repositoryName
  );

  const issues = await getIssuesFromEpics(epics, repositoryName);

  return issues;
}

module.exports = fetchIssues;
