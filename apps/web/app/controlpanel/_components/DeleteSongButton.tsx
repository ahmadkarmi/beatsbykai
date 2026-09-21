"use client";

import { deleteSongAction } from "@/lib/admin/actions";

export default function DeleteSongButton({ slug, title }: { slug: string; title: string }) {
  return (
    <form
      action={deleteSongAction.bind(null, slug)}
      onSubmit={(e) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <button type="submit" className="cp-btn-danger text-[11px] py-2 px-3">
        Delete
      </button>
    </form>
  );
}
