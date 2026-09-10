<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Category;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * GET /api/posts
     *
     * Advanced search, filtering, sorting and pagination.
     *
     * Supported query parameters:
     *
     * search
     * category_id
     * sort
     * direction
     * per_page
     */
    public function index(Request $request)
    {
        $query = Post::with('category');

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('body', 'like', '%' . $search . '%');
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Category Filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        /*
        |--------------------------------------------------------------------------
        | Sorting
        |--------------------------------------------------------------------------
        */

        $allowedSorts = [
            'id',
            'title',
            'created_at',
            'updated_at',
        ];

        $sort = $request->get('sort', 'created_at');

        if (!in_array($sort, $allowedSorts)) {
            $sort = 'created_at';
        }

        $direction = strtolower(
            $request->get('direction', 'desc')
        );

        if (!in_array($direction, ['asc', 'desc'])) {
            $direction = 'desc';
        }

        $query->orderBy($sort, $direction);

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

        $perPage = (int) $request->get('per_page', 5);

        if ($perPage < 1) {
            $perPage = 5;
        }

        if ($perPage > 50) {
            $perPage = 50;
        }

        $posts = $query->paginate($perPage);

        return response()->json([
            'data' => $posts->items(),

            'pagination' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
                'from' => $posts->firstItem(),
                'to' => $posts->lastItem(),
            ],
        ], 200);
    }

    /**
     * POST /api/posts
     *
     * Create a new post.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        $post = Post::create($validated);

        $post->load('category');

        return response()->json([
            'message' => 'Post created successfully',
            'data' => $post,
        ], 201);
    }

    /**
     * GET /api/posts/{id}
     *
     * Fetch single post.
     */
    public function show($id)
    {
        $post = Post::with('category')->findOrFail($id);

        return response()->json([
            'data' => $post,
        ], 200);
    }

    /**
     * PUT /api/posts/{id}
     *
     * Update post.
     */
    public function update(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
        ]);

        $post->update($validated);

        $post->load('category');

        return response()->json([
            'message' => 'Post updated successfully',
            'data' => $post,
        ], 200);
    }

    /**
     * DELETE /api/posts/{id}
     *
     * Delete post.
     */
    public function destroy($id)
    {
        Post::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Post deleted successfully',
        ], 200);
    }

    /**
     * GET /api/posts-statistics
     *
     * Dashboard statistics.
     */
    public function statistics()
    {
        $totalPosts = Post::count();

        $todayPosts = Post::whereDate(
            'created_at',
            today()
        )->count();

        $weekPosts = Post::whereBetween(
            'created_at',
            [
                now()->startOfWeek(),
                now()->endOfWeek(),
            ]
        )->count();

        $monthPosts = Post::whereMonth(
            'created_at',
            now()->month
        )
        ->whereYear(
            'created_at',
            now()->year
        )
        ->count();

        $totalCategories = Category::count();

        $latestPost = Post::with('category')
            ->latest()
            ->first();

        $categoryStatistics = Category::withCount('posts')
            ->orderByDesc('posts_count')
            ->get([
                'id',
                'name',
            ]);

        return response()->json([
            'data' => [
                'total_posts' => $totalPosts,
                'today_posts' => $todayPosts,
                'week_posts' => $weekPosts,
                'month_posts' => $monthPosts,
                'total_categories' => $totalCategories,

                'latest_post' => $latestPost,

                'category_statistics' => $categoryStatistics,
            ],
        ], 200);
    }
}