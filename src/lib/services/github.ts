import { Octokit } from "octokit";

export type RepoFile = { path: string; content: string | Buffer };

export async function githubLogin(token: string) {
  const gh = new Octokit({ auth: token });
  const { data } = await gh.rest.users.getAuthenticated();
  return data.login;
}

// Cria um repositório (no usuário ou numa organização) e envia todos os arquivos num único commit.
export async function createRepoWithFiles(opts: {
  token: string;
  owner?: string; // organização; vazio = conta do token
  name: string;
  description: string;
  files: RepoFile[];
  isPrivate?: boolean;
}) {
  const gh = new Octokit({ auth: opts.token });
  const login = await githubLogin(opts.token);
  const useOrg = opts.owner && opts.owner !== login;

  const params = { name: opts.name, description: opts.description, private: opts.isPrivate ?? true, auto_init: true };
  const { data: repo } = useOrg
    ? await gh.rest.repos.createInOrg({ org: opts.owner!, ...params })
    : await gh.rest.repos.createForAuthenticatedUser(params);

  const owner = repo.owner.login;
  const branch = repo.default_branch || "main";
  const { data: ref } = await gh.rest.git.getRef({ owner, repo: repo.name, ref: `heads/${branch}` });
  const { data: baseCommit } = await gh.rest.git.getCommit({ owner, repo: repo.name, commit_sha: ref.object.sha });

  const tree = await Promise.all(
    opts.files.map(async (f) => {
      const isBin = Buffer.isBuffer(f.content);
      const { data: blob } = await gh.rest.git.createBlob({
        owner,
        repo: repo.name,
        content: isBin ? (f.content as Buffer).toString("base64") : (f.content as string),
        encoding: isBin ? "base64" : "utf-8",
      });
      return { path: f.path, mode: "100644" as const, type: "blob" as const, sha: blob.sha };
    }),
  );
  const { data: newTree } = await gh.rest.git.createTree({ owner, repo: repo.name, base_tree: baseCommit.tree.sha, tree });
  const { data: commit } = await gh.rest.git.createCommit({
    owner,
    repo: repo.name,
    message: "Landing page gerada automaticamente",
    tree: newTree.sha,
    parents: [baseCommit.sha],
  });
  await gh.rest.git.updateRef({ owner, repo: repo.name, ref: `heads/${branch}`, sha: commit.sha });

  return { fullName: `${owner}/${repo.name}`, htmlUrl: repo.html_url, branch };
}
