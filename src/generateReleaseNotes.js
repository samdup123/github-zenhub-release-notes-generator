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
    "Issue",
    "Issue Title",
    "Pull Request",
    "Pull Request Title",
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
  commitsBetweenReleases.forEach((commit) => {
    const pr = commit.associatedPullRequests.nodes[0];
    const prNumber = pr.number;
    const prTitle = pr.title;
    const date = formatDate(new Date(commit.committedDate));

    const issueNumbers = prsToIssueNumbers[prNumber];

    const authorRef = "[@" + commit.author.user.login + "](" + githubUrl + commit.author.user.login + ")";
    const prRef = "[#" + prNumber + "](" + githubUrl + repoOwner + "/" + repoName + "/pull/" + prNumber + ")";
    const IssueRef = (issueNumber) => "[#" + issueNumber + "](" + githubUrl + repoOwner + "/" + repoName + "/issues/" + issueNumber + ")";

    if (issueNumbers) {
      issueNumbers.forEach((issueNumber) => {
        const issue = issues[issueNumber];
        releaseNotesTableData.push([
          IssueRef(issueNumber),
          issue.title,
          prRef,
          prTitle,
          authorRef,
          date,
        ]);
      });
    } else {
      releaseNotesTableData.push(["", "", prRef, prTitle, authorRef, date]);
    }
  });

  const releaseNotesTable = generateMarkdownTable(releaseNotesTableData);

  const releaseNotes = `# Release Notes between ${releaseA} and ${releaseB}\n\n${releaseNotesTable}`;

  return releaseNotes;
};
