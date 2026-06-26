const fetchIssues = require("./src/fetchIssues");
const fetchAllTags = require("./src/fetchAllTags");
const fetchCommits = require("./src/fetchCommits");
const connectPrsToIssueNumbers = require("./src/connectPrsToIssueNumbers");
const generateReleaseNotes = require("./src/generateReleaseNotes");
const fs = require("fs");
const minimist = require("minimist");

const args = minimist(process.argv.slice(2));

const repoOwner = args["repo-owner"];
const repoName = args["repo-name"];
const branchName = args["branch-name"];
const githubApiToken = args["github-api-token"];
const releaseA = args["_"][0];
const releaseB = args["_"][1];

const checkArgs = (args) => {
  if (!(repoOwner && repoName && branchName && githubApiToken && releaseA)) {
    console.error(
      `Please provide the following arguments: repoOwner, repoName, branchName, githubApiToken, releaseA, releaseB
       Example (generating release notes for the React Library):
       node index.js \
         --repo-owner facebook \
         --repo-name react \
         --branch-name master \
         --github-api-token <find this on your github account, don't store anywhere on the internet> \
         releaseA # must match the name of an actual release tag on the GitHub Repository \
         [releaseB] (optional) # must match the name of an actual release tag on the GitHub Repository and be newer than releaseA. If not provided, the latest commit on the branch will be used


      ----------------

      What you provided
      --repo-owner ${args["repo-owner"]}
      --repo-name ${args["repo-name"]}
      --branch-name ${args["branch-name"]}
      --github-api-token ${args["github-api-token"]}
      releaseA ${args["_"][0]}
      releaseB ${args["_"][1]}
      `,
    );
    process.exit(1);
  }
};

const tagExists = (releaseName, tags) => {
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    if (tag.name === releaseName) {
      return true;
    }
  }
  return false;
};

const tagExistsOrIsLatestCommit = (releaseName, tags) => {
  if (!releaseName) {
  } else {
    return tagExists(releaseName, tags);
  }
};

const core = async () => {
  checkArgs(args);
  console.log("fetching tags");
  const tags = await fetchAllTags(repoOwner, repoName, githubApiToken);

  const releaseaExists = tagExists(releaseA, tags);
  const latestCommit = releaseB === undefined;
  const releasebExists = tagExists(releaseB, tags);

  if (releaseaExists && (releasebExists || latestCommit)) {
    console.log("requested tags found");
  } else {
    if (releaseaExists && !latestCommit && !releasebExists) {
      console.error(
        `the tag you are searching for does not exist (${releaseB}), please use one of the following tags names`,
      );
    } else if (!releaseaExists && (releasebExists || latestCommit)) {
      console.error(
        `the tag you are searching for does not exist (${releaseA}), please use one of the following tags names`,
      );
    } else {
      console.error(
        `the tags you are searching for do not exist (${releaseA}, ${releaseB}), please use one of the following tags names`,
      );
    }
    tags.forEach((tag) => {
      console.error(tag.name);
    });
    process.exit(1);
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
    console.error(
      `releaseA should be older than releaseB. ReleaseA: ${releaseADate}, ReleaseB: ${releaseBDate}`,
    );
    process.exit(1);
  }

  console.log("fetching commits");

  const commits = await fetchCommits(
    repoOwner,
    repoName,
    branchName,
    releaseADate,
    githubApiToken,
  );

  fs.writeFileSync("./commits.json", JSON.stringify(commits, null, 2));

  const commitsBetweenReleases = commits.filter((commit) => {
    const commitDate = new Date(commit.committedDate);
    return commitDate > releaseADate && commitDate <= releaseBDate;
  });

  console.log("fetching issues");

  const issues = await fetchIssues(repoOwner, repoName, githubApiToken);

  fs.writeFileSync("./issues.json", JSON.stringify(issues, null, 2));

  const prsToIssueNumbers = connectPrsToIssueNumbers(issues, repoName);

  console.log("TESTING PR 1031", prsToIssueNumbers[1031]);

  console.log("generating release notes");

  const releaseNotes = generateReleaseNotes(
    commitsBetweenReleases,
    prsToIssueNumbers,
    issues,
    releaseA,
    releaseB,
    repoOwner,
    repoName,
  );

  fs.mkdirSync("./output/", { recursive: true });
  fs.writeFileSync("./output/releaseNotes.md", releaseNotes);
};

core();
