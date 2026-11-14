import { AuthForm } from "../AuthForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthForm next={next} />;
}
