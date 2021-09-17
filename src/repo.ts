import {actionsGithub} from './lib'
import {GetPullRequest} from './__generated__/get-pull-request'

const gql = (strings: TemplateStringsArray): string => strings.raw[0]

interface GetRepoParams {
  token: string
  owner: string
  repo: string
  currentBranch?: string
}
export function getRepo({token, owner, repo}: GetRepoParams) {
  const octokit = actionsGithub.getOctokit(token)

  const repository = {
    async getCommits({base, head}: {base: string; head: string}) {
      return octokit.rest.repos
        .compareCommitsWithBasehead({
          owner,
          repo,
          basehead: `${base}...${head}`,
          per_page: 100,
        })
        .then(r => r.data.commits)
        .catch(e => {
          throw new Error(
            `Could not find either "${head}" or "${base}" refs in git. Check that these refs exist and try again.`,
          )
        })
      // return octokit.rest.git.getRef({repo, owner, ref: `heads/master`})
    },

    async getPullRequestMessage(number: number) {
      return octokit.graphql<GetPullRequest>(
        gql`
          query GetPullRequest($owner: String!, $repo: String!, $number: Int!) {
            repository(owner: $owner, name: $repo) {
              pullRequest(number: $number) {
                body
                title
                number
                headRefName
                baseRefName
              }
            }
          }
        `,
        {owner, repo, number},
      )
      // return Promise.resolve<GetPullRequest>({
      //   repository: {
      //     pullRequest: {
      //       body: '## Summary\r\n\r\nUpdate the pull request template to include sections that are important to release automation.\r\n\r\n<!-- This is the category in the release notes. Common categories are Components, Infrastructure, and Documentation -->\r\n### Category\r\nInfrastructure\r\n\r\n---',
      //       title: 'chore: Update pull request template',
      //       number: 1268,
      //       headRefName: 'chore/update-pull-request-template',
      //     },
      //   },
      // })
    },
  }

  return repository
}
