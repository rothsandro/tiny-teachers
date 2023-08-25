const got = require('got');

const IGNORED_CONTRIBUTORS = ['stefanjudis', 'github-actions[bot]'];

async function fetchContributors({ page = 1, options }) {
  console.log(`Fetching contributors... Page ${page}`);
  const response = await got({
    url: `https://api.github.com/repos/stefanjudis/tiny-teachers/contributors?per_page=100&page=${page}`,
    ...options,
  });

  const contributors = JSON.parse(response.body)
    .map((contributor) => contributor.login)
    .filter((contributor) => !IGNORED_CONTRIBUTORS.includes(contributor));

  const match =
    response.headers.link &&
    response.headers.link.match(/^<.*?&page=(?<nextPage>\d*?)>; rel="next".*$/);

  console.log({ match, contributors });
  return match
    ? [
        ...contributors,
        ...(await fetchContributors({ page: +match.groups.nextPage, options })),
      ]
    : contributors;
}

module.exports = async function () {
  //  don't hit the API on every rebuild due to rate limits
  console.log(process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'production') {
    try {
      const { GITHUB_ACCESS_TOKEN } = process.env;
      if (!GITHUB_ACCESS_TOKEN) {
        throw new Error('Please define GITHUB_ACCESS_TOKEN');
      }
      const options = {
        headers: {
          authorization: `token ${GITHUB_ACCESS_TOKEN}`,
        },
      };

      return await fetchContributors({ options });
    } catch (e) {
      console.log('were erroring');
      console.error(e);
      return [];
    }
  } else {
    return ['stefanjudis', 'stefanjudis', 'stefanjudis'];
  }
};
