// Cliente mínimo da API pública (GraphQL) do Railway.
// Os nomes de mutations/campos seguem a API pública v2; valide com um token real antes do lançamento.
const ENDPOINT = "https://backboard.railway.com/graphql/v2";

export class RailwayError extends Error {}

export async function railwayGql<T>(token: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { data?: T; errors?: { message: string }[] };
  if (!res.ok || json.errors?.length) {
    throw new RailwayError(json.errors?.map((e) => e.message).join("; ") || `Railway HTTP ${res.status}`);
  }
  return json.data as T;
}

export async function railwayWhoAmI(token: string) {
  try {
    const d = await railwayGql<{ me: { name: string | null; email: string } }>(token, `query { me { name email } }`);
    return d.me.name || d.me.email;
  } catch {
    // Tokens de time/workspace não têm "me"; confirmamos listando projetos.
    await railwayGql(token, `query { projects(first: 1) { edges { node { id } } } }`);
    return "Token de workspace";
  }
}

export async function createProject(token: string, name: string, workspaceId?: string) {
  const d = await railwayGql<{
    projectCreate: { id: string; environments: { edges: { node: { id: string; name: string } }[] } };
  }>(
    token,
    `mutation($input: ProjectCreateInput!) { projectCreate(input: $input) { id environments { edges { node { id name } } } } }`,
    { input: { name, ...(workspaceId ? { workspaceId } : {}) } },
  );
  const env = d.projectCreate.environments.edges[0]?.node;
  if (!env) throw new RailwayError("Projeto criado sem ambiente");
  return { projectId: d.projectCreate.id, environmentId: env.id };
}

// Cria o serviço apontando para o repositório do GitHub; o Railway faz build e deploy a cada push.
// A conta Railway precisa ter o app do GitHub do Railway com acesso ao repositório.
export async function createServiceFromRepo(token: string, projectId: string, name: string, repo: string) {
  const d = await railwayGql<{ serviceCreate: { id: string } }>(
    token,
    `mutation($input: ServiceCreateInput!) { serviceCreate(input: $input) { id } }`,
    { input: { projectId, name, source: { repo }, branch: "main" } },
  );
  return d.serviceCreate.id;
}

export async function createServiceDomain(token: string, serviceId: string, environmentId: string) {
  const d = await railwayGql<{ serviceDomainCreate: { id: string; domain: string } }>(
    token,
    `mutation($input: ServiceDomainCreateInput!) { serviceDomainCreate(input: $input) { id domain } }`,
    { input: { serviceId, environmentId } },
  );
  return d.serviceDomainCreate.domain;
}

export type DnsRecord = { hostlabel: string; recordType: string; requiredValue: string; status: string };

export async function createCustomDomain(
  token: string,
  input: { domain: string; projectId: string; environmentId: string; serviceId: string },
) {
  const d = await railwayGql<{
    customDomainCreate: { id: string; status: { dnsRecords: DnsRecord[]; verificationToken?: string | null } };
  }>(
    token,
    `mutation($input: CustomDomainCreateInput!) {
      customDomainCreate(input: $input) {
        id
        status { dnsRecords { hostlabel recordType requiredValue status } verificationToken }
      }
    }`,
    { input },
  );
  return d.customDomainCreate;
}

export async function latestDeploymentStatus(token: string, serviceId: string, environmentId: string) {
  const d = await railwayGql<{ deployments: { edges: { node: { id: string; status: string } }[] } }>(
    token,
    `query($input: DeploymentListInput!) { deployments(first: 1, input: $input) { edges { node { id status } } } }`,
    { input: { serviceId, environmentId } },
  );
  return d.deployments.edges[0]?.node.status ?? null; // SUCCESS | FAILED | BUILDING | DEPLOYING | ...
}

export async function customDomainStatus(
  token: string,
  ids: { projectId: string; environmentId: string; serviceId: string },
  domainId: string,
) {
  const d = await railwayGql<{
    domains: { customDomains: { id: string; domain: string; status: { dnsRecords: DnsRecord[]; certificateStatus?: string | null } }[] };
  }>(
    token,
    `query($projectId: String!, $environmentId: String!, $serviceId: String!) {
      domains(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId) {
        customDomains { id domain status { dnsRecords { hostlabel recordType requiredValue status } certificateStatus } }
      }
    }`,
    ids,
  );
  return d.domains.customDomains.find((c) => c.id === domainId) ?? null;
}
