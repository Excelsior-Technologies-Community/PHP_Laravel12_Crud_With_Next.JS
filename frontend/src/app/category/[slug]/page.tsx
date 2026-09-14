"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";

export default function CategoryPage() { const { slug } = useParams<{ slug: string }>(); const [posts, setPosts] = useState<any[]>([]); useEffect(() => { api.get("/public/posts", { params: { category: slug } }).then((response) => setPosts(response.data.data)); }, [slug]); return <main className="mx-auto max-w-5xl px-5 py-12"><h1 className="text-4xl font-black">Category: {slug}</h1><div className="mt-8 grid gap-4 md:grid-cols-2">{posts.map((post) => <Link href={`/blog/${post.slug}`} key={post.id} className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-2xl font-black">{post.title}</h2><p className="mt-2 text-sm text-gray-500">{post.reading_time} min read</p></Link>)}</div></main>; }
