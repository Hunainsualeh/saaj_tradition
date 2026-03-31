import { AdminLoginForm } from "./AdminLoginForm";

export const metadata = {
  title: "Admin Login | Saaj Tradition",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;

  return (
    <div className="min-h-screen w-full">
      <AdminLoginForm redirect={redirect} />
    </div>
  );
}
