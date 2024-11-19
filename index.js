const fetchIssues = require("./src/fetchIssues");
const fetchAllTags = require("./src/fetchAllTags");
const fetchCommits = require("./src/fetchCommits");
const connectPrsToIssueNumbers = require("./src/connectPrsToIssueNumbers");
const generateReleaseNotes = require("./src/generateReleaseNotes");
const fs = require("fs");
const minimist = require("minimist");

const args = minimist(process.argv.slice(2));

const repoOwner = args['repo-owner']
const repoName = args['repo-name']
const branchName = args['branch-name']
const workspaceId = args['workspace-id']
const releaseId = args['release-id']
const githubApiToken = args['github-api-token']
const zenhubApiToken = args['zenhub-api-token']
const releaseA = args['_'][0];
const releaseB = args['_'][1];

const checkArgs = (args) => {

  if (!(repoOwner && repoName && branchName && workspaceId && releaseId && githubApiToken && zenhubApiToken && releaseA && releaseB)) {
    console.error(
      `Please provide the following arguments: repoOwner, repoName, branchName, workspaceId, releaseId, githubApiToken, zenhubApiToken, releaseA, releaseB
       Example (generating release notes for the React Library):
       node index.js \
         --repo-owner facebook \
         --repo-name react \
         --workspace-id <you need to use GitHub GraphQL to find this> \
         --release-id <you need to use Zenhub GraphQL to find this> \
         --github-api-token <find this on your github account, don't store anywhere on the internet> \
         --zenhub-api-token <find this on your zenhub account, don't store anywhere on the internet> \
         releaseA # must match the name of an actual release tag on the GitHub Repository \
         releaseB # must match the name of an actual release tag on the GitHub Repository and be newer than releaseA


      ----------------

      What you provided
      --repo-owner ${args['repo-owner']}
      --repo-name ${args['repo-name']}
      --branch-name ${args['branch-name']}
      --workspace-id ${args['workspace-id']}
      --release-id ${args['release-id']}
      --github-api-token ${args['github-api-token']}
      --zenhub-api-token ${args['zenhub-api-token']}
      releaseA ${args['_'][0]}
      releaseA ${args['_'][1]}
      `
    );
    process.exit(1);
  }
}

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
  checkArgs(args);
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
    repoName,
    zenhubApiToken
  );

  const prsToIssueNumbers = connectPrsToIssueNumbers(
    issues,
    repoName
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
