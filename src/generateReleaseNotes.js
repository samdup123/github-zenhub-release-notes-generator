const githubUrl = "https://github.com/";

function generateMarkdownTable(data) {
  const headerRow = `| ${data[0].join(" | ")} |\n`;
  const separatorRow = `| ${data[0].map(() => "---").join(" | ")} |\n`;
  const bodyRows = data
    .slice(1)
    .map((row) => `| ${row.join(" | ")} |\n`)
    .join("");

  return headerRow + separatorRow + bodyRows;
}

const releaseNotesTableData = [
  [
    "Pull Request",
    "Pull Request Title",
    "Issue(s)",
    "Issue Title(s)",
    "Author",
    "Date",
  ],
];

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

module.exports = (
  commitsBetweenReleases,
  prsToIssueNumbers,
  issues,
  releaseA,
  releaseB,
  repoOwner,
  repoName
) => {
  const formatAuthorRef = (login) =>
    "[@" + login + "](" + githubUrl + login + ")";

  const formatPrRef = (prNumber) =>
    "[#" +
    prNumber +
    "](" +
    githubUrl +
    repoOwner +
    "/" +
    repoName +
    "/pull/" +
    prNumber +
    ")";

  const formatIssueRef = (issueNumber) =>
    "[#" +
    issueNumber +
    "](" +
    githubUrl +
    repoOwner +
    "/" +
    repoName +
    "/issues/" +
    issueNumber +
    ")";

  commitsBetweenReleases.forEach((commit) => {
    const pr = commit.associatedPullRequests.nodes[0];
    const prNumber = pr.number;
    const prTitle = pr.title;
    const date = formatDate(new Date(commit.committedDate));
    const login = commit.author.user.login;
    const issueNumbers = prsToIssueNumbers[prNumber];

    const authorRef = formatAuthorRef(login);
    const prRef = formatPrRef(prNumber);

    if (issueNumbers) {
      const firstIssueNumber = issueNumbers[0];
      let issueRefs = formatIssueRef(firstIssueNumber);
      let issueTitles = issues[firstIssueNumber].title;

      for (let i = 1; i < issueNumbers.length; i++) {
        const issueNumber = issueNumbers[i];
        issueRefs += ", " + formatIssueRef(issueNumber);
        issueTitles += ", " + issues[issueNumber].title;
      }
      releaseNotesTableData.push([
        prRef,
        prTitle,
        issueRefs,
        issueTitles,
        authorRef,
        date,
      ]);
    } else {
      releaseNotesTableData.push([prRef, prTitle, "", "", authorRef, date]);
    }
  });

  const releaseNotesTable = generateMarkdownTable(releaseNotesTableData);

  const releaseNotes = `# Release Notes between ${releaseA} and ${releaseB}\n\n${releaseNotesTable}`;

  return releaseNotes;
};
