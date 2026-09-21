"use client";

import { useState, useRef, KeyboardEvent } from "react";
import type { AdminSong } from "@/lib/admin/api";
import type { SongLabel } from "@beatsbykai/core";

const ALL_LABELS: { value: SongLabel; color: string; bg: string }[] = [
  { value: "new",      color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  { value: "trending", color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/30" },
  { value: "featured", color: "text-violet-400",  bg: "bg-violet-500/15 border-violet-500/30" },
];

type UploadState = {
  phase: "mp3" | "cover";
  pct: number;
} | null;

type Props = {
  song?: AdminSong;
  action: (formData: FormData) => Promise<{ error: string } | { slug: string; uploadToken: string } | void>;
  submitLabel: string;
};

export default function SongForm({ song, action, submitLabel }: Props) {
  // Controlled state for all text fields — guarantees no file data leaks into FormData
  const [title, setTitle] = useState(song?.title ?? "");
  const [slug, setSlug] = useState(song?.slug ?? "");
  const [description, setDescription] = useState(song?.description ?? "");
  const [lyrics, setLyrics] = useState(song?.lyrics ?? "");
  const [explanation, setExplanation] = useState(song?.explanation ?? "");
  const [published, setPublished] = useState(song?.published ?? false);
  const [labels, setLabels] = useState<SongLabel[]>(song?.labels ?? []);
  const [tags, setTags] = useState<string[]>(song?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [upload, setUpload] = useState<UploadState>(null);
  const [error, setError] = useState<string | null>(null);

  const mp3Ref = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!song) setSlug(val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  const toggleLabel = (label: SongLabel) =>
    setLabels((prev) => prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]);

  const addTag = (raw: string) => {
    const cleaned = raw.trim().replace(/^#+/, "");
    if (!cleaned) return;
    const tag = `#${cleaned}`;
    if (!tags.includes(tag)) setTags((prev) => [...prev, tag]);
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  function xhrUpload(url: string, file: File, contentType: string, onProgress: (pct: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else {
          try { reject(new Error(JSON.parse(xhr.responseText)?.error ?? `Upload failed (${xhr.status})`)); }
          catch { reject(new Error(`Upload failed (${xhr.status})`)); }
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
      xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));
      xhr.send(file);
    });
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setUpload(null);

    const mp3File = mp3Ref.current?.files?.[0];
    const coverFile = coverRef.current?.files?.[0];
    const hasFiles = !!(mp3File || coverFile);

    // Build FormData purely from React state — zero file data, zero risk of payload overflow
    const formData = new FormData();
    formData.set("title", title);
    formData.set("slug", slug);
    formData.set("description", description);
    formData.set("lyrics", lyrics);
    formData.set("explanation", explanation);
    formData.set("published", String(published));
    formData.set("has_files", String(hasFiles));
    for (const l of ALL_LABELS) {
      formData.set(`label_${l.value}`, labels.includes(l.value) ? "true" : "false");
    }
    formData.set("tags", tags.join(","));

    let result: { error: string } | { slug: string; uploadToken: string } | void;
    try {
      result = await action(formData);
    } catch (err) {
      // redirect() throws — that's a success, let Next.js handle navigation
      return;
    }

    if (!result) return; // redirect happened

    if ("error" in result) {
      setError(result.error);
      setSaving(false);
      return;
    }

    // Files to upload directly to Worker
    if ("uploadToken" in result) {
      const { slug: savedSlug, uploadToken } = result;
      const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;

      try {
        if (mp3File) {
          setUpload({ phase: "mp3", pct: 0 });
          await xhrUpload(
            `${workerUrl}/songs/${savedSlug}/upload?type=mp3&token=${uploadToken}`,
            mp3File,
            mp3File.type || "audio/mpeg",
            (pct) => setUpload({ phase: "mp3", pct })
          );
        }
        if (coverFile) {
          setUpload({ phase: "cover", pct: 0 });
          await xhrUpload(
            `${workerUrl}/songs/${savedSlug}/upload?type=cover&token=${uploadToken}`,
            coverFile,
            coverFile.type || "image/jpeg",
            (pct) => setUpload({ phase: "cover", pct })
          );
        }
      } catch (err) {
        setError((err as Error).message);
        setSaving(false);
        setUpload(null);
        return;
      }

      window.location.href = "/controlpanel";
    }
  };

  const isLoading = saving || upload !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Upload progress */}
      {upload && (
        <div className="bg-cp-surface border border-cp-border rounded-xl px-5 py-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-cp-muted">
              {upload.phase === "mp3" ? "Uploading MP3" : "Uploading Cover Art"}
            </p>
            <p className="text-[11px] font-bold text-cp-accent tabular-nums">{upload.pct}%</p>
          </div>
          <div className="h-1.5 bg-cp-border rounded-full overflow-hidden">
            <div
              className="h-full bg-cp-accent rounded-full transition-all duration-150"
              style={{ width: `${upload.pct}%` }}
            />
          </div>
          {upload.pct === 100 && (
            <p className="text-[10px] text-cp-muted">Processing…</p>
          )}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-cp-surface border border-cp-border rounded-xl p-5 space-y-4">
        <h3 className={sectionTitle}>Basic Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Title *</label>
            <input
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={inputClass}
              placeholder="Black Book Margins"
            />
          </div>
          <div>
            <label className={labelClass}>Slug *</label>
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              readOnly={!!song}
              className={`${inputClass} ${song ? "opacity-40 cursor-not-allowed" : ""}`}
              placeholder="black-book-margins"
            />
            {song && <p className="text-[10px] text-cp-muted/40 mt-1">Slug cannot be changed after creation.</p>}
          </div>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            placeholder="One-line description"
          />
        </div>
      </div>

      {/* Labels + Tags */}
      <div className="bg-cp-surface border border-cp-border rounded-xl p-5 space-y-5">
        <h3 className={sectionTitle}>Labels &amp; Tags</h3>
        <div>
          <label className={labelClass}>Labels</label>
          <div className="flex items-center gap-2 flex-wrap">
            {ALL_LABELS.map(({ value, color, bg }) => {
              const active = labels.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleLabel(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-150 ${
                    active ? `${bg} ${color}` : "bg-transparent border-cp-border text-cp-muted hover:border-cp-muted"
                  }`}
                >
                  {active && <span className="mr-1">✓</span>}
                  {value}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className={labelClass}>Tags</label>
          <div
            className={`${inputClass} flex flex-wrap gap-1.5 items-center cursor-text min-h-[42px] h-auto py-2`}
            onClick={() => tagInputRef.current?.focus()}
          >
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 bg-cp-accent/15 text-cp-accent text-[11px] font-semibold px-2 py-0.5 rounded-full">
                {tag}
                <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(tag); }} className="hover:text-white transition-colors leading-none" aria-label={`Remove ${tag}`}>×</button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => { if (tagInput) { addTag(tagInput); setTagInput(""); } }}
              placeholder={tags.length === 0 ? "#intellectual, #bars, #hiphop…" : ""}
              className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-cp-text placeholder-cp-muted/30"
            />
          </div>
          <p className="text-[10px] text-cp-muted/40 mt-1.5">Press Enter, comma, or space to add a tag. # is added automatically.</p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-cp-surface border border-cp-border rounded-xl p-5 space-y-4">
        <h3 className={sectionTitle}>Content</h3>
        <div>
          <label className={labelClass}>Lyrics</label>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={14}
            className={`${inputClass} resize-y font-mono text-xs leading-relaxed`}
            placeholder={"[Verse 1]\n..."}
          />
        </div>
        <div>
          <label className={labelClass}>Kai Says <span className="normal-case text-cp-muted/40 ml-1">— optional</span></label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={4}
            className={`${inputClass} resize-y`}
            placeholder="Context or meaning behind the track..."
          />
        </div>
      </div>

      {/* Files */}
      <div className="bg-cp-surface border border-cp-border rounded-xl p-5 space-y-4">
        <h3 className={sectionTitle}>Files</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              MP3 {song?.mp3Url && <span className="text-emerald-400 normal-case ml-1">✓ Uploaded</span>}
            </label>
            <input ref={mp3Ref} type="file" accept="audio/mpeg,audio/mp3" className={fileInputClass} />
          </div>
          <div>
            <label className={labelClass}>
              Cover Art {song?.coverArtUrl && <span className="text-emerald-400 normal-case ml-1">✓ Uploaded</span>}
            </label>
            <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" className={fileInputClass} />
            {song?.coverArtUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={song.coverArtUrl} alt="Current cover" className="w-16 h-16 object-cover rounded-lg mt-3 border border-cp-border" />
            )}
          </div>
        </div>
      </div>

      {/* Publish + Actions */}
      <div className="bg-cp-surface border border-cp-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={published}
            onClick={() => setPublished((p) => !p)}
            className={`w-11 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ${published ? "bg-cp-accent" : "bg-cp-border"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${published ? "translate-x-5" : "translate-x-1"}`} />
          </button>
          <div>
            <p className="text-sm font-semibold text-cp-text">{published ? "Published" : "Draft"}</p>
            <p className="text-[11px] text-cp-muted">{published ? "Visible to listeners" : "Hidden from listeners"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1 border-t border-cp-border">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-cp-accent hover:bg-cp-accent-hover disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors text-center"
          >
            {upload
              ? `${upload.phase === "mp3" ? "MP3" : "Cover"} ${upload.pct}%`
              : saving
              ? "Saving…"
              : submitLabel}
          </button>
          <a
            href="/controlpanel"
            className={`flex-1 text-sm text-center py-2.5 rounded-lg transition-colors ${
              isLoading ? "pointer-events-none opacity-30 text-cp-muted" : "text-cp-muted hover:text-cp-text hover:bg-cp-border"
            }`}
          >
            Cancel
          </a>
        </div>
      </div>
    </form>
  );
}

const sectionTitle = "text-[11px] font-semibold uppercase tracking-widest text-cp-muted";
const labelClass = "block text-[11px] font-semibold uppercase tracking-widest text-cp-muted mb-2";
const inputClass = "w-full bg-cp-bg border border-cp-border rounded-lg px-4 py-2.5 text-sm text-cp-text placeholder-cp-muted/30 focus:outline-none focus:border-cp-accent transition-colors";
const fileInputClass = "w-full bg-cp-bg border border-cp-border rounded-lg px-3 py-2 text-sm text-cp-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cp-accent/15 file:text-cp-accent cursor-pointer";
