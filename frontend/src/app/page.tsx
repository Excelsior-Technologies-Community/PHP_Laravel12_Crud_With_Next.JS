"use client";

import { useEffect, useState } from "react";

import api from "@/services/api";

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
  status: "draft" | "published" | "archived";
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
  draft_posts: number;
  published_posts: number;
  archived_posts: number;
  latest_post: Post | null;
  category_statistics: Category[];
}

export default function Home() {
  /*
  |--------------------------------------------------------------------------
  | Posts
  |--------------------------------------------------------------------------
  */

  const [posts, setPosts] = useState<Post[]>([]);

  const [title, setTitle] = useState("");

  const [body, setBody] = useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [status, setStatus] =
    useState<
      "draft" | "published" | "archived"
    >("draft");

  const [editId, setEditId] =
    useState<number | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Categories
  |--------------------------------------------------------------------------
  */

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [categoryName, setCategoryName] =
    useState("");

  const [categoryDescription, setCategoryDescription] =
    useState("");

  const [categoryEditId, setCategoryEditId] =
    useState<number | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] =
    useState("");

  const [filterCategory, setFilterCategory] =
    useState("");

  const [filterStatus, setFilterStatus] =
    useState("");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [sort, setSort] =
    useState("created_at");

  const [direction, setDirection] =
    useState("desc");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [perPage, setPerPage] =
    useState(5);

  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Selection
  |--------------------------------------------------------------------------
  */

  const [selectedIds, setSelectedIds] =
    useState<number[]>([]);

  /*
  |--------------------------------------------------------------------------
  | Statistics
  |--------------------------------------------------------------------------
  */

  const [statistics, setStatistics] =
    useState<Statistics | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Dark Mode
  |--------------------------------------------------------------------------
  */

  const [darkMode, setDarkMode] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load Theme
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const saved =
      localStorage.getItem(
        "post_manager_theme"
      );

    if (saved === "dark") {
      setDarkMode(true);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Save Theme
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    localStorage.setItem(
      "post_manager_theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  /*
  |--------------------------------------------------------------------------
  | Fetch Categories
  |--------------------------------------------------------------------------
  */

  const fetchCategories =
    async () => {
      try {
        const response =
          await api.get(
            "/categories"
          );

        setCategories(
          response.data.data
        );
      } catch (error) {
        console.error(
          "Category loading failed:",
          error
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Fetch Posts
  |--------------------------------------------------------------------------
  */

  const fetchPosts =
    async () => {
      try {
        setLoading(true);

        setError("");

        const response =
          await api.get(
            "/posts",
            {
              params: {
                search:
                  search || undefined,

                category_id:
                  filterCategory ||
                  undefined,

                status:
                  filterStatus ||
                  undefined,

                date_from:
                  dateFrom ||
                  undefined,

                date_to:
                  dateTo ||
                  undefined,

                sort,

                direction,

                page: currentPage,

                per_page: perPage,
              },
            }
          );

        setPosts(
          response.data.data
        );

        setPagination(
          response.data.pagination
        );

        /*
        |--------------------------------------------------------------------------
        | Remove selected IDs that no longer exist
        |--------------------------------------------------------------------------
        */

        setSelectedIds(
          (oldIds) =>
            oldIds.filter((id) =>
              response.data.data.some(
                (post: Post) =>
                  post.id === id
              )
            )
        );
      } catch (error) {
        console.error(error);

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

  const fetchStatistics =
    async () => {
      try {
        const response =
          await api.get(
            "/posts/statistics"
          );

        setStatistics(
          response.data.data
        );
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
  | Filters Changed
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timer =
      setTimeout(() => {
        fetchPosts();
      }, 300);

    return () =>
      clearTimeout(timer);
  }, [
    search,
    filterCategory,
    filterStatus,
    dateFrom,
    dateTo,
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

  const submitPost =
    async () => {
      if (
        !title.trim() ||
        !body.trim()
      ) {
        alert(
          "Please fill title and body."
        );

        return;
      }

      try {
        const data = {
          title,
          body,
          category_id:
            categoryId || null,
          status,
        };

        if (editId !== null) {
          await api.put(
            `/posts/${editId}`,
            data
          );

          alert(
            "Post updated successfully."
          );
        } else {
          await api.post(
            "/posts",
            data
          );

          alert(
            "Post created successfully."
          );
        }

        resetPostForm();

        await fetchPosts();

        await fetchStatistics();
      } catch (error: any) {
        console.error(error);

        alert(
          error?.response?.data
            ?.message ||
            "Unable to save post."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Edit Post
  |--------------------------------------------------------------------------
  */

  const editPost =
    (post: Post) => {
      setEditId(post.id);

      setTitle(post.title);

      setBody(post.body);

      setCategoryId(
        post.category_id
          ? String(
              post.category_id
            )
          : ""
      );

      setStatus(
        post.status
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

  const deletePost =
    async (id: number) => {
      if (
        !confirm(
          "Delete this post?"
        )
      ) {
        return;
      }

      try {
        await api.delete(
          `/posts/${id}`
        );

        alert(
          "Post deleted successfully."
        );

        await fetchPosts();

        await fetchStatistics();
      } catch (error) {
        console.error(error);

        alert(
          "Unable to delete post."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Duplicate Post
  |--------------------------------------------------------------------------
  */

  const duplicatePost =
    async (id: number) => {
      try {
        await api.post(
          `/posts/${id}/duplicate`
        );

        alert(
          "Post duplicated successfully."
        );

        await fetchPosts();

        await fetchStatistics();
      } catch (error) {
        console.error(error);

        alert(
          "Unable to duplicate post."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Quick Status Change
  |--------------------------------------------------------------------------
  */

  const changeStatus =
    async (
      id: number,
      newStatus:
        | "draft"
        | "published"
        | "archived"
    ) => {
      try {
        await api.patch(
          `/posts/${id}/status`,
          {
            status: newStatus,
          }
        );

        await fetchPosts();

        await fetchStatistics();
      } catch (error) {
        console.error(error);

        alert(
          "Unable to change status."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Reset Post Form
  |--------------------------------------------------------------------------
  */

  const resetPostForm =
    () => {
      setEditId(null);

      setTitle("");

      setBody("");

      setCategoryId("");

      setStatus("draft");
    };

  /*
  |--------------------------------------------------------------------------
  | Category Submit
  |--------------------------------------------------------------------------
  */

  const submitCategory =
    async () => {
      if (
        !categoryName.trim()
      ) {
        alert(
          "Enter category name."
        );

        return;
      }

      try {
        if (
          categoryEditId !== null
        ) {
          await api.put(
            `/categories/${categoryEditId}`,
            {
              name:
                categoryName,
              description:
                categoryDescription,
            }
          );

          alert(
            "Category updated successfully."
          );
        } else {
          await api.post(
            "/categories",
            {
              name:
                categoryName,
              description:
                categoryDescription,
            }
          );

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
          error?.response?.data
            ?.message ||
            "Unable to save category."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Edit Category
  |--------------------------------------------------------------------------
  */

  const editCategory =
    (category: Category) => {
      setCategoryEditId(
        category.id
      );

      setCategoryName(
        category.name
      );

      setCategoryDescription(
        category.description ||
          ""
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Delete Category
  |--------------------------------------------------------------------------
  */

  const deleteCategory =
    async (id: number) => {
      if (
        !confirm(
          "Delete this category?"
        )
      ) {
        return;
      }

      try {
        await api.delete(
          `/categories/${id}`
        );

        alert(
          "Category deleted successfully."
        );

        await fetchCategories();

        await fetchPosts();

        await fetchStatistics();
      } catch (error) {
        console.error(error);

        alert(
          "Unable to delete category."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Reset Category
  |--------------------------------------------------------------------------
  */

  const resetCategoryForm =
    () => {
      setCategoryEditId(
        null
      );

      setCategoryName("");

      setCategoryDescription("");
    };

  /*
  |--------------------------------------------------------------------------
  | Reset Filters
  |--------------------------------------------------------------------------
  */

  const resetFilters =
    () => {
      setSearch("");

      setFilterCategory("");

      setFilterStatus("");

      setDateFrom("");

      setDateTo("");

      setSort(
        "created_at"
      );

      setDirection(
        "desc"
      );

      setCurrentPage(1);

      setPerPage(5);
    };

  /*
  |--------------------------------------------------------------------------
  | Selection Toggle
  |--------------------------------------------------------------------------
  */

  const toggleSelection =
    (id: number) => {
      setSelectedIds(
        (oldIds) =>
          oldIds.includes(id)
            ? oldIds.filter(
                (item) =>
                  item !== id
              )
            : [
                ...oldIds,
                id,
              ]
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Select All Current Page
  |--------------------------------------------------------------------------
  */

  const toggleSelectAll =
    () => {
      const pageIds =
        posts.map(
          (post) =>
            post.id
        );

      const allSelected =
        pageIds.every(
          (id) =>
            selectedIds.includes(
              id
            )
        );

      if (allSelected) {
        setSelectedIds(
          (oldIds) =>
            oldIds.filter(
              (id) =>
                !pageIds.includes(
                  id
                )
            )
        );
      } else {
        setSelectedIds(
          (oldIds) => [
            ...new Set([
              ...oldIds,
              ...pageIds,
            ]),
          ]
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Bulk Delete
  |--------------------------------------------------------------------------
  */

  const bulkDelete =
    async () => {
      if (
        selectedIds.length === 0
      ) {
        alert(
          "Select at least one post."
        );

        return;
      }

      if (
        !confirm(
          `Delete ${selectedIds.length} selected post(s)?`
        )
      ) {
        return;
      }

      try {
        await api.post(
          "/posts/bulk-delete",
          {
            ids: selectedIds,
          }
        );

        setSelectedIds([]);

        alert(
          "Selected posts deleted successfully."
        );

        await fetchPosts();

        await fetchStatistics();
      } catch (error) {
        console.error(error);

        alert(
          "Unable to delete selected posts."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Export CSV
  |--------------------------------------------------------------------------
  */

  const exportCSV =
    async () => {
      try {
        const response =
          await api.get(
            "/posts/export",
            {
              params: {
                search:
                  search ||
                  undefined,

                category_id:
                  filterCategory ||
                  undefined,

                status:
                  filterStatus ||
                  undefined,

                date_from:
                  dateFrom ||
                  undefined,

                date_to:
                  dateTo ||
                  undefined,

                sort,

                direction,
              },

              responseType:
                "blob",
            }
          );

        const blob =
          new Blob(
            [response.data],
            {
              type:
                "text/csv",
            }
          );

        const url =
          window.URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            "a"
          );

        link.href = url;

        link.download =
          "posts.csv";

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
          url
        );
      } catch (error) {
        console.error(error);

        alert(
          "Unable to export CSV."
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const goToPage =
    (page: number) => {
      if (!pagination) {
        return;
      }

      if (
        page < 1 ||
        page >
          pagination.last_page
      ) {
        return;
      }

      setCurrentPage(page);
    };

  const getPageNumbers =
    () => {
      if (!pagination) {
        return [];
      }

      const pages: number[] =
        [];

      for (
        let page = 1;
        page <=
          pagination.last_page;
        page++
      ) {
        pages.push(page);
      }

      return pages;
    };

  /*
  |--------------------------------------------------------------------------
  | UI Classes
  |--------------------------------------------------------------------------
  */

  const cardClass =
    darkMode
      ? "bg-gray-800 border-gray-700 text-white"
      : "bg-white border-gray-200 text-gray-800";

  const inputClass =
    darkMode
      ? "bg-gray-900 border-gray-600 text-white placeholder-gray-400"
      : "bg-white border-gray-300 text-gray-800";

  /*
  |--------------------------------------------------------------------------
  | JSX
  |--------------------------------------------------------------------------
  */

  return (
    <main
      className={
        darkMode
          ? "min-h-screen bg-gray-950 text-white py-10 px-4"
          : "min-h-screen bg-gradient-to-br from-indigo-50 via-white to-gray-100 py-10 px-4"
      }
    >
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">

          <div>
            <h1
              className={
                darkMode
                  ? "text-4xl font-bold text-indigo-400"
                  : "text-4xl font-bold text-indigo-700"
              }
            >
              Next.js + Laravel CRUD
            </h1>

            <p
              className={
                darkMode
                  ? "text-gray-400 mt-2"
                  : "text-gray-600 mt-2"
              }
            >
              Advanced Post Management Dashboard
            </p>
          </div>

          {/* DARK MODE */}

          <button
            onClick={() =>
              setDarkMode(
                !darkMode
              )
            }
            className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
          >
            {darkMode
              ? "☀️ Light Mode"
              : "🌙 Dark Mode"}
          </button>

        </div>

        {/* STATISTICS */}

        <section>
          <h2 className="text-2xl font-bold mb-4">
            📊 Post Statistics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">

            <div
              className={`rounded-xl shadow-md p-5 border ${cardClass}`}
            >
              <p className="text-sm opacity-70">
                Total
              </p>

              <p className="text-3xl font-bold text-indigo-500 mt-2">
                {statistics?.total_posts ??
                  0}
              </p>
            </div>

            <div
              className={`rounded-xl shadow-md p-5 border ${cardClass}`}
            >
              <p className="text-sm opacity-70">
                Today
              </p>

              <p className="text-3xl font-bold text-green-500 mt-2">
                {statistics?.today_posts ??
                  0}
              </p>
            </div>

            <div
              className={`rounded-xl shadow-md p-5 border ${cardClass}`}
            >
              <p className="text-sm opacity-70">
                Week
              </p>

              <p className="text-3xl font-bold text-blue-500 mt-2">
                {statistics?.week_posts ??
                  0}
              </p>
            </div>

            <div
              className={`rounded-xl shadow-md p-5 border ${cardClass}`}
            >
              <p className="text-sm opacity-70">
                Month
              </p>

              <p className="text-3xl font-bold text-purple-500 mt-2">
                {statistics?.month_posts ??
                  0}
              </p>
            </div>

            <div
              className={`rounded-xl shadow-md p-5 border ${cardClass}`}
            >
              <p className="text-sm opacity-70">
                Draft
              </p>

              <p className="text-3xl font-bold text-yellow-500 mt-2">
                {statistics?.draft_posts ??
                  0}
              </p>
            </div>

            <div
              className={`rounded-xl shadow-md p-5 border ${cardClass}`}
            >
              <p className="text-sm opacity-70">
                Published
              </p>

              <p className="text-3xl font-bold text-green-500 mt-2">
                {statistics?.published_posts ??
                  0}
              </p>
            </div>

            <div
              className={`rounded-xl shadow-md p-5 border ${cardClass}`}
            >
              <p className="text-sm opacity-70">
                Archived
              </p>

              <p className="text-3xl font-bold text-red-500 mt-2">
                {statistics?.archived_posts ??
                  0}
              </p>
            </div>

          </div>
        </section>

        {/* CATEGORY MANAGEMENT */}

        <section
          className={`rounded-xl shadow-md p-6 border ${cardClass}`}
        >
          <h2 className="text-xl font-bold mb-4">
            🏷️ Category Management
          </h2>

          <div className="grid md:grid-cols-3 gap-3">

            <input
              className={`rounded-md border px-3 py-2 ${inputClass}`}
              placeholder="Category name"
              value={
                categoryName
              }
              onChange={(e) =>
                setCategoryName(
                  e.target.value
                )
              }
            />

            <input
              className={`rounded-md border px-3 py-2 ${inputClass}`}
              placeholder="Description"
              value={
                categoryDescription
              }
              onChange={(e) =>
                setCategoryDescription(
                  e.target.value
                )
              }
            />

            <div className="flex gap-2">

              <button
                onClick={
                  submitCategory
                }
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                {categoryEditId !==
                null
                  ? "Update Category"
                  : "Add Category"}
              </button>

              {categoryEditId !==
                null && (
                <button
                  onClick={
                    resetCategoryForm
                  }
                  className="border border-gray-400 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              )}

            </div>

          </div>

          <div className="mt-5 grid md:grid-cols-3 gap-3">

            {categories.map(
              (category) => (
                <div
                  key={
                    category.id
                  }
                  className={
                    darkMode
                      ? "border border-gray-700 rounded-lg p-4 bg-gray-900"
                      : "border rounded-lg p-4 bg-gray-50"
                  }
                >
                  <div className="flex justify-between gap-3">

                    <div>
                      <h3 className="font-semibold text-indigo-500">
                        {
                          category.name
                        }
                      </h3>

                      <p className="text-sm opacity-70 mt-1">
                        {category.description ||
                          "No description"}
                      </p>

                      <p className="text-xs opacity-60 mt-2">
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
                        className="text-xs text-blue-500 border border-blue-300 px-2 py-1 rounded"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteCategory(
                            category.id
                          )
                        }
                        className="text-xs text-red-500 border border-red-300 px-2 py-1 rounded"
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

        {/* CREATE / EDIT POST */}

        <section
          className={`rounded-xl shadow-md p-6 border ${cardClass}`}
        >
          <h2 className="text-xl font-bold mb-4">
            {editId !== null
              ? "✏️ Edit Post"
              : "➕ Create Post"}
          </h2>

          <div className="space-y-4">

            <input
              className={`w-full rounded-md border px-3 py-2 ${inputClass}`}
              placeholder="Post title"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
            />

            <textarea
              className={`w-full rounded-md border px-3 py-2 ${inputClass}`}
              placeholder="Post description"
              rows={5}
              value={body}
              onChange={(e) =>
                setBody(
                  e.target.value
                )
              }
            />

            <div className="grid md:grid-cols-2 gap-4">

              <select
                className={`w-full rounded-md border px-3 py-2 ${inputClass}`}
                value={
                  categoryId
                }
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
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {
                        category.name
                      }
                    </option>
                  )
                )}
              </select>

              {/* STATUS */}

              <select
                className={`w-full rounded-md border px-3 py-2 ${inputClass}`}
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target
                      .value as
                      | "draft"
                      | "published"
                      | "archived"
                  )
                }
              >
                <option value="draft">
                  Draft
                </option>

                <option value="published">
                  Published
                </option>

                <option value="archived">
                  Archived
                </option>
              </select>

            </div>

            <button
              onClick={
                submitPost
              }
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
            >
              {editId !== null
                ? "Update Post"
                : "Add Post"}
            </button>

            {editId !== null && (
              <button
                onClick={
                  resetPostForm
                }
                className="w-full border border-gray-400 py-2 rounded-md"
              >
                Cancel Edit
              </button>
            )}

          </div>
        </section>

        {/* SEARCH FILTER */}

        <section
          className={`rounded-xl shadow-md p-6 border ${cardClass}`}
        >
          <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">

            <h2 className="text-xl font-bold">
              🔎 Search, Filter & Sort
            </h2>

            <div className="flex gap-2 flex-wrap">

              <button
                onClick={
                  resetFilters
                }
                className="border border-gray-400 px-4 py-2 rounded-md hover:bg-gray-100 hover:text-gray-800"
              >
                🔄 Reset
              </button>

              <button
                onClick={
                  exportCSV
                }
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                📥 Export CSV
              </button>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

            {/* SEARCH */}

            <input
              className={`rounded-md border px-3 py-2 ${inputClass}`}
              placeholder="Search title or body..."
              value={search}
              onChange={(e) => {
                setSearch(
                  e.target.value
                );

                setCurrentPage(
                  1
                );
              }}
            />

            {/* CATEGORY */}

            <select
              className={`rounded-md border px-3 py-2 ${inputClass}`}
              value={
                filterCategory
              }
              onChange={(e) => {
                setFilterCategory(
                  e.target.value
                );

                setCurrentPage(
                  1
                );
              }}
            >
              <option value="">
                All Categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {
                      category.name
                    }
                  </option>
                )
              )}
            </select>

            {/* STATUS FILTER */}

            <select
              className={`rounded-md border px-3 py-2 ${inputClass}`}
              value={
                filterStatus
              }
              onChange={(e) => {
                setFilterStatus(
                  e.target.value
                );

                setCurrentPage(
                  1
                );
              }}
            >
              <option value="">
                All Statuses
              </option>

              <option value="draft">
                Draft
              </option>

              <option value="published">
                Published
              </option>

              <option value="archived">
                Archived
              </option>
            </select>

            {/* DATE FROM */}

            <input
              type="date"
              className={`rounded-md border px-3 py-2 ${inputClass}`}
              value={
                dateFrom
              }
              onChange={(e) => {
                setDateFrom(
                  e.target.value
                );

                setCurrentPage(
                  1
                );
              }}
            />

            {/* DATE TO */}

            <input
              type="date"
              className={`rounded-md border px-3 py-2 ${inputClass}`}
              value={dateTo}
              onChange={(e) => {
                setDateTo(
                  e.target.value
                );

                setCurrentPage(
                  1
                );
              }}
            />

            {/* SORT */}

            <select
              className={`rounded-md border px-3 py-2 ${inputClass}`}
              value={sort}
              onChange={(e) => {
                setSort(
                  e.target.value
                );

                setCurrentPage(
                  1
                );
              }}
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

              <option value="status">
                Status
              </option>
            </select>

            {/* DIRECTION */}

            <select
              className={`rounded-md border px-3 py-2 ${inputClass}`}
              value={
                direction
              }
              onChange={(e) => {
                setDirection(
                  e.target.value
                );

                setCurrentPage(
                  1
                );
              }}
            >
              <option value="desc">
                Descending
              </option>

              <option value="asc">
                Ascending
              </option>
            </select>

            {/* PER PAGE */}

            <select
              className={`rounded-md border px-3 py-2 ${inputClass}`}
              value={perPage}
              onChange={(e) => {
                setPerPage(
                  Number(
                    e.target.value
                  )
                );

                setCurrentPage(
                  1
                );
              }}
            >
              <option value={5}>
                5 per page
              </option>

              <option value={10}>
                10 per page
              </option>

              <option value={20}>
                20 per page
              </option>

              <option value={50}>
                50 per page
              </option>
            </select>

          </div>
        </section>

        {/* BULK ACTION BAR */}

        {selectedIds.length >
          0 && (
          <section className="bg-red-50 border border-red-200 rounded-xl p-4">

            <div className="flex flex-col md:flex-row justify-between items-center gap-3">

              <p className="text-red-700 font-semibold">
                {selectedIds.length} post(s)
                selected
              </p>

              <button
                onClick={
                  bulkDelete
                }
                className="bg-red-600 text-white px-5 py-2 rounded-md hover:bg-red-700"
              >
                🗑️ Delete Selected
              </button>

            </div>

          </section>
        )}

        {/* POSTS */}

        <section
          className={`rounded-xl shadow-md p-6 border ${cardClass}`}
        >

          <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-4">

            <h2 className="text-xl font-bold">
              📝 Posts
            </h2>

            <div className="flex items-center gap-3">

              {pagination && (
                <span className="text-sm opacity-70">
                  Showing{" "}
                  {pagination.from ??
                    0}
                  -
                  {pagination.to ??
                    0}
                  of{" "}
                  {
                    pagination.total
                  }
                </span>
              )}

              {posts.length >
                0 && (
                <button
                  onClick={
                    toggleSelectAll
                  }
                  className="border border-indigo-300 text-indigo-500 px-3 py-1 rounded-md text-sm"
                >
                  Select All
                </button>
              )}

            </div>

          </div>

          {loading && (
            <p className="text-center text-indigo-500 py-5">
              Loading posts...
            </p>
          )}

          {error && (
            <p className="text-center text-red-500 py-5">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            posts.length ===
              0 && (
              <div className="text-center py-10">
                <p className="opacity-60">
                  No posts found.
                </p>

                <p className="text-sm opacity-50 mt-1">
                  Try changing your filters.
                </p>
              </div>
            )}

          <div className="space-y-4">

            {posts.map(
              (post) => (
                <div
                  key={
                    post.id
                  }
                  className={
                    darkMode
                      ? "border border-gray-700 rounded-xl p-5 bg-gray-900"
                      : "border rounded-xl p-5 bg-white"
                  }
                >

                  <div className="flex flex-col lg:flex-row gap-4">

                    {/* CHECKBOX */}

                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(
                          post.id
                        )}
                        onChange={() =>
                          toggleSelection(
                            post.id
                          )
                        }
                        className="w-5 h-5"
                      />
                    </div>

                    {/* CONTENT */}

                    <div className="flex-1">

                      <div className="flex items-center gap-2 flex-wrap">

                        <h3 className="font-bold text-lg text-indigo-500">
                          {
                            post.title
                          }
                        </h3>

                        {post.category && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                            {
                              post
                                .category
                                .name
                            }
                          </span>
                        )}

                        {/* STATUS BADGE */}

                        <span
                          className={
                            post.status ===
                            "published"
                              ? "text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                              : post.status ===
                                "archived"
                              ? "text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full"
                              : "text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full"
                          }
                        >
                          {
                            post.status
                          }
                        </span>

                      </div>

                      <p className="opacity-70 mt-2">
                        {
                          post.body
                        }
                      </p>

                      {post.created_at && (
                        <p className="text-xs opacity-50 mt-3">
                          Created:{" "}
                          {new Date(
                            post.created_at
                          ).toLocaleString()}
                        </p>
                      )}

                      {/* QUICK STATUS */}

                      <div className="flex gap-2 mt-3 flex-wrap">

                        <button
                          onClick={() =>
                            changeStatus(
                              post.id,
                              "draft"
                            )
                          }
                          className="text-xs border border-yellow-300 text-yellow-600 px-2 py-1 rounded"
                        >
                          Draft
                        </button>

                        <button
                          onClick={() =>
                            changeStatus(
                              post.id,
                              "published"
                            )
                          }
                          className="text-xs border border-green-300 text-green-600 px-2 py-1 rounded"
                        >
                          Publish
                        </button>

                        <button
                          onClick={() =>
                            changeStatus(
                              post.id,
                              "archived"
                            )
                          }
                          className="text-xs border border-red-300 text-red-600 px-2 py-1 rounded"
                        >
                          Archive
                        </button>

                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="flex lg:flex-col gap-2">

                      <button
                        onClick={() =>
                          editPost(
                            post
                          )
                        }
                        className="text-sm text-blue-500 border border-blue-300 px-3 py-1 rounded-md"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          duplicatePost(
                            post.id
                          )
                        }
                        className="text-sm text-purple-500 border border-purple-300 px-3 py-1 rounded-md"
                      >
                        Duplicate
                      </button>

                      <button
                        onClick={() =>
                          deletePost(
                            post.id
                          )
                        }
                        className="text-sm text-red-500 border border-red-300 px-3 py-1 rounded-md"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

          {/* PAGINATION */}

          {pagination &&
            pagination.last_page >
              1 && (
              <div className="flex flex-wrap justify-center gap-2 mt-6">

                {getPageNumbers().map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() =>
                        goToPage(
                          page
                        )
                      }
                      className={`px-3 py-2 rounded-md border ${
                        currentPage ===
                        page
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : darkMode
                          ? "border-gray-600"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

              </div>
            )}

        </section>

        {/* LATEST POST */}

        {statistics?.latest_post && (
          <section
            className={`rounded-xl shadow-md p-6 border ${cardClass}`}
          >

            <h2 className="text-xl font-bold mb-3">
              ⭐ Latest Post
            </h2>

            <div className="border rounded-lg p-4">

              <h3 className="font-bold text-indigo-500">
                {
                  statistics
                    .latest_post
                    .title
                }
              </h3>

              <p className="opacity-70 mt-2">
                {
                  statistics
                    .latest_post
                    .body
                }
              </p>

              {statistics
                .latest_post
                .category && (
                <span className="inline-block mt-3 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                  {
                    statistics
                      .latest_post
                      .category
                      .name
                  }
                </span>
              )}

            </div>
          </section>
        )}

        {/* CATEGORY ANALYTICS */}

        {statistics &&
          statistics
            .category_statistics
            .length > 0 && (
            <section
              className={`rounded-xl shadow-md p-6 border ${cardClass}`}
            >

              <h2 className="text-xl font-bold mb-4">
                📈 Category-wise Statistics
              </h2>

              <div className="grid md:grid-cols-3 gap-4">

                {statistics.category_statistics.map(
                  (category) => (
                    <div
                      key={
                        category.id
                      }
                      className="border rounded-lg p-4"
                    >

                      <div className="flex justify-between">

                        <span className="font-semibold">
                          {
                            category.name
                          }
                        </span>

                        <span className="font-bold text-indigo-500">
                          {
                            category.posts_count ??
                            0
                          }
                        </span>

                      </div>

                      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">

                        <div
                          className="h-2 bg-indigo-600 rounded-full"
                          style={{
                            width: `${
                              statistics.total_posts >
                              0
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