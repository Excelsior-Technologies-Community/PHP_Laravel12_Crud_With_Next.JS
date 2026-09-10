"use client";

import { useEffect, useState } from "react";

import api from "@/services/api";

/*
|--------------------------------------------------------------------------
| Interfaces
|--------------------------------------------------------------------------
*/

interface Category {
  id: number;
  name: string;
  description?: string;
  posts_count?: number;
}

interface Post {
  id: number;
  title: string;
  body: string;
  category_id: number | null;
  category?: Category | null;
  created_at?: string;
  updated_at?: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface Statistics {
  total_posts: number;
  today_posts: number;
  week_posts: number;
  month_posts: number;
  total_categories: number;
  latest_post: Post | null;
  category_statistics: Category[];
}

/*
|--------------------------------------------------------------------------
| Home Component
|--------------------------------------------------------------------------
*/

export default function Home() {
  /*
  |--------------------------------------------------------------------------
  | Post States
  |--------------------------------------------------------------------------
  */

  const [posts, setPosts] = useState<Post[]>([]);

  const [title, setTitle] = useState("");

  const [body, setBody] = useState("");

  const [categoryId, setCategoryId] = useState("");

  const [editId, setEditId] = useState<number | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Category States
  |--------------------------------------------------------------------------
  */

  const [categories, setCategories] = useState<Category[]>([]);

  const [categoryName, setCategoryName] = useState("");

  const [categoryDescription, setCategoryDescription] = useState("");

  const [categoryEditId, setCategoryEditId] =
    useState<number | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Search / Filter / Pagination States
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");

  const [filterCategory, setFilterCategory] = useState("");

  const [sort, setSort] = useState("created_at");

  const [direction, setDirection] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);

  const [perPage, setPerPage] = useState(5);

  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const [statistics, setStatistics] =
    useState<Statistics | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Loading / Error
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Fetch Categories
  |--------------------------------------------------------------------------
  */

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");

      setCategories(response.data.data);
    } catch (error) {
      console.error("Category loading failed:", error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Fetch Posts
  |--------------------------------------------------------------------------
  */

  const fetchPosts = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await api.get("/posts", {
        params: {
          search: search || undefined,

          category_id:
            filterCategory || undefined,

          sort,

          direction,

          page: currentPage,

          per_page: perPage,
        },
      });

      setPosts(response.data.data);

      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Post loading failed:", error);

      setError(
        "Unable to load posts. Please check Laravel API."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Fetch Statistics
  |--------------------------------------------------------------------------
  */

  const fetchStatistics = async () => {
    try {
      const response = await api.get(
        "/posts/statistics"
      );

      setStatistics(response.data.data);
    } catch (error) {
      console.error(
        "Statistics loading failed:",
        error
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial Loading
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchCategories();

    fetchStatistics();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Fetch Posts when Filters Change
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchPosts();
  }, [
    search,
    filterCategory,
    sort,
    direction,
    currentPage,
    perPage,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Submit Post
  |--------------------------------------------------------------------------
  */

  const submitPost = async () => {
    if (!title.trim() || !body.trim()) {
      alert("Please fill title and body.");
      return;
    }

    try {
      if (editId !== null) {
        await api.put(`/posts/${editId}`, {
          title,
          body,
          category_id:
            categoryId || null,
        });

        alert("Post updated successfully.");
      } else {
        await api.post("/posts", {
          title,
          body,
          category_id:
            categoryId || null,
        });

        alert("Post created successfully.");
      }

      resetPostForm();

      await fetchPosts();

      await fetchStatistics();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
        "Unable to save post."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Edit Post
  |--------------------------------------------------------------------------
  */

  const editPost = (post: Post) => {
    setEditId(post.id);

    setTitle(post.title);

    setBody(post.body);

    setCategoryId(
      post.category_id
        ? String(post.category_id)
        : ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Post
  |--------------------------------------------------------------------------
  */

  const deletePost = async (id: number) => {
    if (!confirm("Delete this post?")) {
      return;
    }

    try {
      await api.delete(`/posts/${id}`);

      alert("Post deleted successfully.");

      await fetchPosts();

      await fetchStatistics();
    } catch (error) {
      console.error(error);

      alert("Unable to delete post.");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Reset Post Form
  |--------------------------------------------------------------------------
  */

  const resetPostForm = () => {
    setEditId(null);

    setTitle("");

    setBody("");

    setCategoryId("");
  };

  /*
  |--------------------------------------------------------------------------
  | Create / Update Category
  |--------------------------------------------------------------------------
  */

  const submitCategory = async () => {
    if (!categoryName.trim()) {
      alert("Enter category name.");
      return;
    }

    try {
      if (categoryEditId !== null) {
        await api.put(
          `/categories/${categoryEditId}`,
          {
            name: categoryName,
            description:
              categoryDescription,
          }
        );

        alert(
          "Category updated successfully."
        );
      } else {
        await api.post("/categories", {
          name: categoryName,
          description:
            categoryDescription,
        });

        alert(
          "Category created successfully."
        );
      }

      resetCategoryForm();

      await fetchCategories();

      await fetchStatistics();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
        "Unable to save category."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Edit Category
  |--------------------------------------------------------------------------
  */

  const editCategory = (category: Category) => {
    setCategoryEditId(category.id);

    setCategoryName(category.name);

    setCategoryDescription(
      category.description || ""
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Category
  |--------------------------------------------------------------------------
  */

  const deleteCategory = async (id: number) => {
    if (
      !confirm(
        "Delete this category? Posts will remain but their category will become empty."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);

      alert(
        "Category deleted successfully."
      );

      await fetchCategories();

      await fetchPosts();

      await fetchStatistics();
    } catch (error) {
      console.error(error);

      alert("Unable to delete category.");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Reset Category Form
  |--------------------------------------------------------------------------
  */

  const resetCategoryForm = () => {
    setCategoryEditId(null);

    setCategoryName("");

    setCategoryDescription("");
  };

  /*
  |--------------------------------------------------------------------------
  | Search Handler
  |--------------------------------------------------------------------------
  */

  const handleSearch = (
    value: string
  ) => {
    setSearch(value);

    setCurrentPage(1);
  };

  /*
  |--------------------------------------------------------------------------
  | Category Filter Handler
  |--------------------------------------------------------------------------
  */

  const handleCategoryFilter = (
    value: string
  ) => {
    setFilterCategory(value);

    setCurrentPage(1);
  };

  /*
  |--------------------------------------------------------------------------
  | Sort Handler
  |--------------------------------------------------------------------------
  */

  const handleSort = (
    value: string
  ) => {
    setSort(value);

    setCurrentPage(1);
  };

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const goToPage = (
    page: number
  ) => {
    if (!pagination) {
      return;
    }

    if (
      page < 1 ||
      page > pagination.last_page
    ) {
      return;
    }

    setCurrentPage(page);
  };

  /*
  |--------------------------------------------------------------------------
  | Page Number Generator
  |--------------------------------------------------------------------------
  */

  const getPageNumbers = () => {
    if (!pagination) {
      return [];
    }

    const pages: number[] = [];

    for (
      let page = 1;
      page <= pagination.last_page;
      page++
    ) {
      pages.push(page);
    }

    return pages;
  };

  /*
  |--------------------------------------------------------------------------
  | JSX
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-gray-100 py-10 px-4">

      <div className="max-w-6xl mx-auto space-y-8">

        {/* ========================================================= */}
        {/* HEADER */}
        {/* ========================================================= */}

        <div className="text-center">

          <h1 className="text-4xl font-bold text-indigo-700">
            Next.js + Laravel CRUD
          </h1>

          <p className="text-gray-600 mt-2">
            Advanced REST API Post Management
          </p>

        </div>

        {/* ========================================================= */}
        {/* STATISTICS DASHBOARD */}
        {/* ========================================================= */}

        <section>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📊 Post Statistics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            {/* Total */}
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-indigo-500">

              <p className="text-sm text-gray-500">
                Total Posts
              </p>

              <p className="text-3xl font-bold text-indigo-700 mt-2">
                {statistics?.total_posts ?? 0}
              </p>

            </div>

            {/* Today */}
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">

              <p className="text-sm text-gray-500">
                Today's Posts
              </p>

              <p className="text-3xl font-bold text-green-600 mt-2">
                {statistics?.today_posts ?? 0}
              </p>

            </div>

            {/* Week */}
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">

              <p className="text-sm text-gray-500">
                This Week
              </p>

              <p className="text-3xl font-bold text-blue-600 mt-2">
                {statistics?.week_posts ?? 0}
              </p>

            </div>

            {/* Month */}
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">

              <p className="text-sm text-gray-500">
                This Month
              </p>

              <p className="text-3xl font-bold text-purple-600 mt-2">
                {statistics?.month_posts ?? 0}
              </p>

            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-500">

              <p className="text-sm text-gray-500">
                Categories
              </p>

              <p className="text-3xl font-bold text-orange-600 mt-2">
                {statistics?.total_categories ?? 0}
              </p>

            </div>

          </div>

        </section>

        {/* ========================================================= */}
        {/* CATEGORY MANAGEMENT */}
        {/* ========================================================= */}

        <section className="bg-white rounded-xl shadow-md p-6">

          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🏷️ Category Management
          </h2>

          <div className="grid md:grid-cols-3 gap-3">

            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Category name"
              value={categoryName}
              onChange={(e) =>
                setCategoryName(
                  e.target.value
                )
              }
            />

            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Description"
              value={categoryDescription}
              onChange={(e) =>
                setCategoryDescription(
                  e.target.value
                )
              }
            />

            <div className="flex gap-2">

              <button
                onClick={submitCategory}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                {categoryEditId !== null
                  ? "Update Category"
                  : "Add Category"}
              </button>

              {categoryEditId !== null && (
                <button
                  onClick={
                    resetCategoryForm
                  }
                  className="border border-gray-300 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              )}

            </div>

          </div>

          {/* Category List */}

          <div className="mt-5 grid md:grid-cols-3 gap-3">

            {categories.map(
              (category) => (
                <div
                  key={category.id}
                  className="border rounded-lg p-4 bg-gray-50"
                >

                  <div className="flex justify-between">

                    <div>

                      <h3 className="font-semibold text-indigo-700">
                        {category.name}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {category.description ||
                          "No description"}
                      </p>

                      <p className="text-xs text-gray-500 mt-2">
                        Posts:{" "}
                        {category.posts_count ??
                          0}
                      </p>

                    </div>

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          editCategory(
                            category
                          )
                        }
                        className="text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteCategory(
                            category.id
                          )
                        }
                        className="text-xs text-red-600 border border-red-200 px-2 py-1 rounded"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        </section>

        {/* ========================================================= */}
        {/* CREATE / EDIT POST */}
        {/* ========================================================= */}

        <section className="bg-white rounded-xl shadow-md p-6">

          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editId !== null
              ? "✏️ Edit Post"
              : "➕ Create Post"}
          </h2>

          <div className="space-y-4">

            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Post title"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
            />

            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Post description"
              rows={5}
              value={body}
              onChange={(e) =>
                setBody(e.target.value)
              }
            />

            {/* Category */}

            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={categoryId}
              onChange={(e) =>
                setCategoryId(
                  e.target.value
                )
              }
            >

              <option value="">
                Select Category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}

            </select>

            <button
              onClick={submitPost}
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
            >
              {editId !== null
                ? "Update Post"
                : "Add Post"}
            </button>

            {editId !== null && (
              <button
                onClick={resetPostForm}
                className="w-full border border-gray-300 text-gray-600 py-2 rounded-md hover:bg-gray-50"
              >
                Cancel Edit
              </button>
            )}

          </div>

        </section>

        {/* ========================================================= */}
        {/* SEARCH & FILTER */}
        {/* ========================================================= */}

        <section className="bg-white rounded-xl shadow-md p-6">

          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🔎 Search, Filter & Sort
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

            {/* Search */}

            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Search title or body..."
              value={search}
              onChange={(e) =>
                handleSearch(
                  e.target.value
                )
              }
            />

            {/* Category */}

            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={filterCategory}
              onChange={(e) =>
                handleCategoryFilter(
                  e.target.value
                )
              }
            >

              <option value="">
                All Categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}

            </select>

            {/* Sort */}

            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={sort}
              onChange={(e) =>
                handleSort(
                  e.target.value
                )
              }
            >

              <option value="created_at">
                Created Date
              </option>

              <option value="title">
                Title
              </option>

              <option value="updated_at">
                Updated Date
              </option>

              <option value="id">
                ID
              </option>

            </select>

            {/* Direction */}

            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={direction}
              onChange={(e) => {
                setDirection(
                  e.target.value
                );

                setCurrentPage(1);
              }}
            >

              <option value="desc">
                Descending
              </option>

              <option value="asc">
                Ascending
              </option>

            </select>

          </div>

          {/* Per Page */}

          <div className="mt-4 flex items-center gap-3">

            <label className="text-sm text-gray-600">
              Posts per page:
            </label>

            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={perPage}
              onChange={(e) => {
                setPerPage(
                  Number(
                    e.target.value
                  )
                );

                setCurrentPage(1);
              }}
            >

              <option value={3}>
                3
              </option>

              <option value={5}>
                5
              </option>

              <option value={10}>
                10
              </option>

              <option value={20}>
                20
              </option>

            </select>

          </div>

        </section>

        {/* ========================================================= */}
        {/* POSTS */}
        {/* ========================================================= */}

        <section className="bg-white rounded-xl shadow-md p-6">

          <div className="flex justify-between items-center mb-4">

            <h2 className="text-xl font-bold text-gray-800">
              📝 Posts
            </h2>

            {pagination && (
              <span className="text-sm text-gray-500">
                Showing{" "}
                {pagination.from ?? 0}
                -
                {pagination.to ?? 0}
                of{" "}
                {pagination.total}
              </span>
            )}

          </div>

          {loading && (
            <p className="text-center text-indigo-600 py-5">
              Loading posts...
            </p>
          )}

          {error && (
            <p className="text-center text-red-600 py-5">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            posts.length === 0 && (
              <div className="text-center py-10">

                <p className="text-gray-500">
                  No posts found.
                </p>

                <p className="text-sm text-gray-400 mt-1">
                  Try changing your search or filters.
                </p>

              </div>
            )}

          <div className="space-y-4">

            {posts.map(
              (post) => (
                <div
                  key={post.id}
                  className="border rounded-xl p-5 hover:shadow-sm transition"
                >

                  <div className="flex flex-col md:flex-row justify-between gap-4">

                    {/* Content */}

                    <div className="flex-1">

                      <div className="flex items-center gap-2 flex-wrap">

                        <h3 className="font-bold text-lg text-indigo-700">
                          {post.title}
                        </h3>

                        {post.category && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                            {post.category.name}
                          </span>
                        )}

                      </div>

                      <p className="text-gray-600 mt-2">
                        {post.body}
                      </p>

                      {post.created_at && (
                        <p className="text-xs text-gray-400 mt-3">
                          Created:{" "}
                          {new Date(
                            post.created_at
                          ).toLocaleString()}
                        </p>
                      )}

                    </div>

                    {/* Actions */}

                    <div className="flex gap-2 items-start">

                      <button
                        onClick={() =>
                          editPost(post)
                        }
                        className="text-sm text-blue-600 border border-blue-200 px-3 py-1 rounded-md hover:bg-blue-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deletePost(
                            post.id
                          )
                        }
                        className="text-sm text-red-600 border border-red-200 px-3 py-1 rounded-md hover:bg-red-50"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

          {/* ===================================================== */}
          {/* PAGINATION */}
          {/* ===================================================== */}

          {pagination &&
            pagination.last_page > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 mt-6">

                {/* Previous */}

                <button
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    goToPage(
                      currentPage - 1
                    )
                  }
                  className="px-3 py-2 border rounded-md disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Previous
                </button>

                {/* Page Numbers */}

                {getPageNumbers().map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() =>
                        goToPage(page)
                      }
                      className={`px-3 py-2 rounded-md border ${
                        currentPage === page
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* Next */}

                <button
                  disabled={
                    currentPage ===
                    pagination.last_page
                  }
                  onClick={() =>
                    goToPage(
                      currentPage + 1
                    )
                  }
                  className="px-3 py-2 border rounded-md disabled:opacity-40 hover:bg-gray-50"
                >
                  Next →
                </button>

              </div>
            )}

        </section>

        {/* ========================================================= */}
        {/* LATEST POST */}
        {/* ========================================================= */}

        {statistics?.latest_post && (
          <section className="bg-white rounded-xl shadow-md p-6">

            <h2 className="text-xl font-bold text-gray-800 mb-3">
              ⭐ Latest Post
            </h2>

            <div className="border rounded-lg p-4">

              <h3 className="font-bold text-indigo-700">
                {statistics.latest_post.title}
              </h3>

              <p className="text-gray-600 mt-2">
                {statistics.latest_post.body}
              </p>

              {statistics.latest_post.category && (
                <span className="inline-block mt-3 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                  {
                    statistics
                      .latest_post
                      .category.name
                  }
                </span>
              )}

            </div>

          </section>
        )}

        {/* ========================================================= */}
        {/* CATEGORY ANALYTICS */}
        {/* ========================================================= */}

        {statistics &&
          statistics.category_statistics
            .length > 0 && (
            <section className="bg-white rounded-xl shadow-md p-6">

              <h2 className="text-xl font-bold text-gray-800 mb-4">
                📈 Category-wise Post Statistics
              </h2>

              <div className="grid md:grid-cols-3 gap-4">

                {statistics.category_statistics.map(
                  (category) => (
                    <div
                      key={category.id}
                      className="border rounded-lg p-4"
                    >

                      <div className="flex justify-between">

                        <span className="font-semibold text-gray-700">
                          {category.name}
                        </span>

                        <span className="font-bold text-indigo-600">
                          {category.posts_count ??
                            0}
                        </span>

                      </div>

                      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">

                        <div
                          className="h-2 bg-indigo-600 rounded-full"
                          style={{
                            width: `${
                              statistics.total_posts > 0
                                ? Math.min(
                                    100,
                                    ((category.posts_count ??
                                      0) /
                                      statistics.total_posts) *
                                      100
                                  )
                                : 0
                            }%`,
                          }}
                        />

                      </div>

                    </div>
                  )
                )}

              </div>

            </section>
          )}

      </div>

    </main>
  );
}