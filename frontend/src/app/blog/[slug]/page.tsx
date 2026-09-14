"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/services/api";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any>(null);
  const [comment, setComment] = useState({ name: "", email: "", body: "" });
  useEffect(() => { api.get(`/public/posts/${slug}`).then((response) => setPost(response.data.data)); }, [slug]);
  if (!post) return <main className="p-10">Loading...</main>;
  return <main className="mx-auto max-w-3xl px-5 py-12"><p className="text-sm font-bold uppercase tracking-widest text-[#b35c3d]">{post.category?.name || "Journal"}</p><h1 className="mt-3 text-5xl font-black">{post.title}</h1><p className="mt-3 text-sm text-gray-500">{post.reading_time} min read · {post.views_count} views</p><article className="prose mt-10 max-w-none" dangerouslySetInnerHTML={{ __html: post.body }} /><div className="mt-12 border-t pt-8"><h2 className="text-2xl font-black">Join the conversation</h2><form className="mt-4 grid gap-3" onSubmit={async (event) => { event.preventDefault(); await api.post(`/public/posts/${post.id}/comments`, comment); setComment({ name: "", email: "", body: "" }); alert("Comment submitted for moderation"); }}><input required placeholder="Name" value={comment.name} onChange={(e) => setComment({ ...comment, name: e.target.value })} className="rounded-xl border p-3" /><input required type="email" placeholder="Email" value={comment.email} onChange={(e) => setComment({ ...comment, email: e.target.value })} className="rounded-xl border p-3" /><textarea required placeholder="Comment" value={comment.body} onChange={(e) => setComment({ ...comment, body: e.target.value })} className="rounded-xl border p-3" /><button className="rounded-xl bg-[#18211d] p-3 font-bold text-white">Comment</button></form></div></main>;
}
