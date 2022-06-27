# Configure git for the github action bot to allow pushing to the repo
git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
git config --local user.name "github-actions[bot]"
git remote set-url origin https://x-access-token:${GITHUBPAT}@github.com/bluescape/bluescape-cli
