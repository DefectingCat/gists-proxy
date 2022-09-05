import { Octokit } from 'octokit';

const password = process.env.GITHUB_API;
const octokit = new Octokit({
    auth: password,
});

export default octokit;
