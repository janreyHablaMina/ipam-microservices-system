import LogoutButton from "@/components/LogoutButton";
import UserIpManager from "@/components/UserIpManager";

export default function UserDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-[50px] py-[50px] text-slate-100">
      <div className="w-full rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold md:text-3xl">User Dashboard</h1>
            <p className="mt-2 text-sm text-slate-300">
              Manage your own IP addresses. You can create, view, update, and delete your records.
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          This page only shows IP records created by your account.
        </div>

        <UserIpManager />
      </div>
    </main>
  );
}
