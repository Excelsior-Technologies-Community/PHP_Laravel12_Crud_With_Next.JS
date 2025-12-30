## PART 2 – FRONTEND (Next.js + Tailwind)

---

### 2.1 Create Next.js App

```bash
npx create-next-app@latest frontend

```

---

### 2.2 Install Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
```

---

### 2.3 Tailwind Config
`tailwind.config.js`

```js
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

### 2.4 PostCSS Config
`postcss.config.js`

```js
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
```

---

### 2.5 Global Styles
`src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: linear-gradient(135deg, #f8fafc, #eef2ff);
  color: #1f2937;
}
```

---

### 2.6 Root Layout
`src/app/layout.tsx`

```tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

---

### 2.7 Axios API Service
`src/services/api.ts`

```ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    Accept: "application/json",
  },
});

export default api;
```

---


### 2.8 Main Page (CRUD UI)
`src/app/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

interface Post {
  id: number;
  title: string;
  body: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const fetchPosts = async () => {
    const res = await api.get("/posts");
    setPosts(res.data.data);
  };

  const submitPost = async () => {
    if (!title || !body) return alert("Fill all fields");

    if (editId) {
      await api.put(`/posts/${editId}`, { title, body });
      setEditId(null);
    } else {
      await api.post("/posts", { title, body });
    }

    setTitle("");
    setBody("");
    fetchPosts();
  };

  const deletePost = async (id: number) => {
    if (!confirm("Delete this post?")) return;
    await api.delete(`/posts/${id}`);
    fetchPosts();
  };

  const editPost = (post: Post) => {
    setEditId(post.id);
    setTitle(post.title);
    setBody(post.body);
  };

  const cancelEdit = () => {
    setEditId(null);
    setTitle("");
    setBody("");
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 py-10">
      <div className="max-w-lg mx-auto space-y-6">

        <h1 className="text-3xl font-bold text-center text-indigo-700">
          Next.js + Laravel CRUD
        </h1>

        <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {editId ? "Edit Post" : "Create Post"}
          </h2>

          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full rounded-md border px-3 py-2"
            placeholder="Post description"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <button
            onClick={submitPost}
            className="w-full bg-indigo-600 text-white py-2 rounded-md"
          >
            {editId ? "Update Post" : "Add Post"}
          </button>

          {editId && (
            <button
              onClick={cancelEdit}
              className="w-full border text-gray-600 py-2 rounded-md"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Posts</h2>

          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="flex justify-between border p-3 rounded">
                <div>
                  <h3 className="font-semibold text-indigo-700">{post.title}</h3>
                  <p className="text-sm text-gray-600">{post.body}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => editPost(post)}
                    className="text-xs text-blue-600 border px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-xs text-red-600 border px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
```

---

## RUN PROJECT

### Backend
```bash
php artisan serve
```

### Frontend
```bash
npm run dev
```

---

## OUTPUT

POST INDEX:-

<img width="1908" height="329" alt="Screenshot 2025-12-30 130732" src="https://github.com/user-attachments/assets/c3362f29-a366-41f8-b216-518cf45237fd" />

POST CREATE:-  

<img width="1910" height="262" alt="Screenshot 2025-12-30 120512" src="https://github.com/user-attachments/assets/50c009ac-6392-4090-ac48-c158b88799b8" />

POST EDIT:-

<img width="1900" height="164" alt="Screenshot 2025-12-30 130712" src="https://github.com/user-attachments/assets/d7e2f5b5-e225-49f9-8abe-6086eb5c74d4" />
