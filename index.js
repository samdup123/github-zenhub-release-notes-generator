const GraphQlQueries = require("./src/GraphQlQueries");
const fetchIssues = require("./src/fetchIssues");
const fetchAllTags = require("./src/fetchAllTags");
const fetchCommits = require("./src/fetchCommits");
const connectPrsToIssueNumbers = require("./src/connectPrsToIssueNumbers");
const generateReleaseNotes = require("./src/generateReleaseNotes");
const fs = require("fs");

const repoOwner = process.argv[2];
const repoName = process.argv[3];
const branchName = process.argv[4];
const workspaceId = process.argv[5];
const releaseId = process.argv[6];
const repositoryName = process.argv[7];
const githubApiToken = process.argv[8];
const zenhubApiToken = process.argv[9];
const releaseA = process.argv[10];
const releaseB = process.argv[11];

const tagExists = (releaseName, tags) => {
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    if (tag.name === releaseName) {
      return true;
    }
  }
  return false;
};

const core = async () => {
  console.log("fetching tags");
  const tags = await fetchAllTags(repoOwner, repoName, githubApiToken);

  const releaseaExists = tagExists(releaseA, tags);
  const releasebExists = tagExists(releaseB, tags);

  if (!releaseaExists && !releasebExists) {
    console.error(
      "the tag you are searching for does not exist, please use one of the following tags names"
    );
    tags.forEach((tag) => {
      console.error(tag.name);
    });
    process.exit(1);
  } else {
    console.log("requested tags found");
  }

  let releaseADate;
  let releaseBDate;
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    if (tag.name === releaseA) {
      releaseADate = new Date(tag.target.author.date);
    }
    if (tag.name === releaseB) {
      releaseBDate = new Date(tag.target.author.date);
    }
  }

  if (releaseADate > releaseBDate) {
    console.error("releaseA should be older than releaseB");
    process.exit(1);
  }

  console.log("fetching commits");

  const commits = await fetchCommits(
    repoOwner,
    repoName,
    branchName,
    releaseADate,
    githubApiToken
  );

  const commitsBetweenReleases = commits.filter((commit) => {
    const commitDate = new Date(commit.committedDate);
    return commitDate > releaseADate && commitDate <= releaseBDate;
  });

  console.log("fetching issues");

  const issues = await fetchIssues(
    workspaceId,
    releaseId,
    repositoryName,
    zenhubApiToken
  );

  const prsToIssueNumbers = connectPrsToIssueNumbers(
    issues,
    repositoryName
  );

  console.log("generating release notes");

  const releaseNotes = generateReleaseNotes(
    commitsBetweenReleases,
    prsToIssueNumbers,
    issues,
    releaseA,
    releaseB
  );

  fs.mkdirSync("./output/", { recursive: true });
  fs.writeFileSync("./output/releaseNotes.md", releaseNotes);
};

core();
