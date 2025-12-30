"use client"; // Marks this component as Client Component

// React hooks import
import { useEffect, useState } from "react";

// Axios API instance
import api from "@/services/api";

// Post interface (TypeScript type safety)
interface Post {
  id: number;
  title: string;
  body: string;
}

// Home page component
export default function Home() {
  // State to store posts list
  const [posts, setPosts] = useState<Post[]>([]);

  // State for post title input
  const [title, setTitle] = useState("");

  // State for post body input
  const [body, setBody] = useState("");

  // State to track edit mode (post id)
  const [editId, setEditId] = useState<number | null>(null);

  // Fetch all posts from Laravel API
  const fetchPosts = async () => {
    const res = await api.get("/posts");
    setPosts(res.data.data);
  };

  // Create OR Update post
  const submitPost = async () => {
    if (!title || !body) return alert("Fill all fields");

    if (editId) {
      // Update existing post
      await api.put(`/posts/${editId}`, { title, body });
      setEditId(null); // Exit edit mode
    } else {
      // Create new post
      await api.post("/posts", { title, body });
    }

    // Reset form
    setTitle("");
    setBody("");
    fetchPosts(); // Refresh posts list
  };

  // Delete a post by ID
  const deletePost = async (id: number) => {
    if (!confirm("Delete this post?")) return;
    await api.delete(`/posts/${id}`);
    fetchPosts(); // Refresh posts list
  };

  // Set form data for editing
  const editPost = (post: Post) => {
    setEditId(post.id);
    setTitle(post.title);
    setBody(post.body);
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditId(null);
    setTitle("");
    setBody("");
  };

  // Fetch posts on first render
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-gray-100 py-10">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Page heading */}
        <h1 className="text-3xl font-bold text-center text-indigo-700">
          Next.js + Laravel CRUD
        </h1>

        {/* Create / Edit post card */}
        <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {editId ? "Edit Post" : "Create Post"}
          </h2>

          {/* Title input */}
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Body textarea */}
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="Post description"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          {/* Submit button */}
          <button
            onClick={submitPost}
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
          >
            {editId ? "Update Post" : "Add Post"}
          </button>

          {/* Cancel edit button */}
          {editId && (
            <button
              onClick={cancelEdit}
              className="w-full border border-gray-300 text-gray-600 py-2 rounded-md"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* Posts list card */}
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Posts
          </h2>

          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex justify-between border rounded-lg p-3"
              >
                {/* Post content */}
                <div>
                  <h3 className="font-semibold text-indigo-700">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {post.body}
                  </p>
                </div>

                {/* Action buttons */}
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
