"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [isOpen, setIsOpen] = useState(false);

  function openDialog() {
    setIsOpen(true);
  }

  function closeDialog() {
    setIsOpen(false);
  }

  async function confirmLogout() {
    try {
      await fetch("/logout", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
      >
        Logout
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-xl border border-white/15 bg-slate-900 p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Confirm Logout</h2>
            <p className="mt-2 text-sm text-slate-300">
              Are you sure you want to sign out of the dashboard?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-md bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
