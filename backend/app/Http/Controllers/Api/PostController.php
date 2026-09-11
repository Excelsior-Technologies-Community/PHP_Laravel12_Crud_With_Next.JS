<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PostController extends Controller
{
    /**
     * GET /api/posts
     *
     * Search
     * Category filter
     * Status filter
     * Date range filter
     * Sorting
     * Pagination
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
            $query->where(
                'category_id',
                $request->category_id
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Status Filter
        |--------------------------------------------------------------------------
        */

        if ($request->filled('status')) {
            $allowedStatuses = [
                'draft',
                'published',
                'archived',
            ];

            if (in_array($request->status, $allowedStatuses)) {
                $query->where(
                    'status',
                    $request->status
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Date From
        |--------------------------------------------------------------------------
        */

        if ($request->filled('date_from')) {
            $query->whereDate(
                'created_at',
                '>=',
                $request->date_from
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Date To
        |--------------------------------------------------------------------------
        */

        if ($request->filled('date_to')) {
            $query->whereDate(
                'created_at',
                '<=',
                $request->date_to
            );
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
            'status',
        ];

        $sort = $request->get(
            'sort',
            'created_at'
        );

        if (!in_array($sort, $allowedSorts)) {
            $sort = 'created_at';
        }

        $direction = strtolower(
            $request->get(
                'direction',
                'desc'
            )
        );

        if (!in_array(
            $direction,
            ['asc', 'desc']
        )) {
            $direction = 'desc';
        }

        $query->orderBy(
            $sort,
            $direction
        );

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

        $perPage = (int) $request->get(
            'per_page',
            5
        );

        $allowedPerPages = [
            5,
            10,
            20,
            50,
        ];

        if (!in_array(
            $perPage,
            $allowedPerPages
        )) {
            $perPage = 5;
        }

        $posts = $query->paginate(
            $perPage
        );

        return response()->json([
            'data' => $posts->items(),

            'pagination' => [
                'current_page' =>
                    $posts->currentPage(),

                'last_page' =>
                    $posts->lastPage(),

                'per_page' =>
                    $posts->perPage(),

                'total' =>
                    $posts->total(),

                'from' =>
                    $posts->firstItem(),

                'to' =>
                    $posts->lastItem(),
            ],
        ], 200);
    }

    /**
     * POST /api/posts
     *
     * Create post.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' =>
                'required|string|max:255',

            'body' =>
                'required|string',

            'category_id' =>
                'nullable|exists:categories,id',

            'status' =>
                'required|in:draft,published,archived',
        ]);

        $post = Post::create(
            $validated
        );

        $post->load('category');

        return response()->json([
            'message' =>
                'Post created successfully',

            'data' =>
                $post,
        ], 201);
    }

    /**
     * GET /api/posts/{id}
     */
    public function show($id)
    {
        $post = Post::with(
            'category'
        )->findOrFail($id);

        return response()->json([
            'data' => $post,
        ], 200);
    }

    /**
     * PUT /api/posts/{id}
     */
    public function update(
        Request $request,
        $id
    ) {
        $post = Post::findOrFail($id);

        $validated = $request->validate([
            'title' =>
                'required|string|max:255',

            'body' =>
                'required|string',

            'category_id' =>
                'nullable|exists:categories,id',

            'status' =>
                'required|in:draft,published,archived',
        ]);

        $post->update(
            $validated
        );

        $post->load('category');

        return response()->json([
            'message' =>
                'Post updated successfully',

            'data' =>
                $post,
        ], 200);
    }

    /**
     * DELETE /api/posts/{id}
     */
    public function destroy($id)
    {
        Post::findOrFail($id)
            ->delete();

        return response()->json([
            'message' =>
                'Post deleted successfully',
        ], 200);
    }

    /**
     * POST /api/posts/bulk-delete
     *
     * Bulk delete selected posts.
     */
    public function bulkDelete(
        Request $request
    ) {
        $validated = $request->validate([
            'ids' =>
                'required|array|min:1',

            'ids.*' =>
                'integer|exists:posts,id',
        ]);

        $deleted = Post::whereIn(
            'id',
            $validated['ids']
        )->delete();

        return response()->json([
            'message' =>
                'Selected posts deleted successfully',

            'deleted_count' =>
                $deleted,
        ], 200);
    }

    /**
     * POST /api/posts/{id}/duplicate
     *
     * Duplicate a post.
     */
    public function duplicate($id)
    {
        $post = Post::findOrFail($id);

        $duplicate = $post->replicate();

        $duplicate->title =
            $post->title . ' (Copy)';

        $duplicate->status = 'draft';

        $duplicate->save();

        $duplicate->load('category');

        return response()->json([
            'message' =>
                'Post duplicated successfully',

            'data' =>
                $duplicate,
        ], 201);
    }

    /**
     * PATCH /api/posts/{id}/status
     *
     * Quickly change post status.
     */
    public function updateStatus(
        Request $request,
        $id
    ) {
        $validated = $request->validate([
            'status' =>
                'required|in:draft,published,archived',
        ]);

        $post = Post::findOrFail($id);

        $post->update([
            'status' =>
                $validated['status'],
        ]);

        $post->load('category');

        return response()->json([
            'message' =>
                'Post status updated successfully',

            'data' =>
                $post,
        ], 200);
    }

    /**
     * GET /api/posts/export
     *
     * Export filtered posts as CSV.
     */
    public function export(
        Request $request
    ): StreamedResponse {
        $query = Post::with('category');

        /*
        |--------------------------------------------------------------------------
        | Same Filters As Index
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where(
                    'title',
                    'like',
                    '%' . $search . '%'
                )
                ->orWhere(
                    'body',
                    'like',
                    '%' . $search . '%'
                );
            });
        }

        if ($request->filled('category_id')) {
            $query->where(
                'category_id',
                $request->category_id
            );
        }

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->status
            );
        }

        if ($request->filled('date_from')) {
            $query->whereDate(
                'created_at',
                '>=',
                $request->date_from
            );
        }

        if ($request->filled('date_to')) {
            $query->whereDate(
                'created_at',
                '<=',
                $request->date_to
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Sort
        |--------------------------------------------------------------------------
        */

        $allowedSorts = [
            'id',
            'title',
            'created_at',
            'updated_at',
            'status',
        ];

        $sort = $request->get(
            'sort',
            'created_at'
        );

        if (!in_array(
            $sort,
            $allowedSorts
        )) {
            $sort = 'created_at';
        }

        $direction = strtolower(
            $request->get(
                'direction',
                'desc'
            )
        );

        if (!in_array(
            $direction,
            ['asc', 'desc']
        )) {
            $direction = 'desc';
        }

        $query->orderBy(
            $sort,
            $direction
        );

        $posts = $query->get();

        $filename =
            'posts-' .
            now()->format(
                'Y-m-d-H-i-s'
            ) .
            '.csv';

        return response()->streamDownload(
            function () use ($posts) {
                $file = fopen(
                    'php://output',
                    'w'
                );

                fputcsv(
                    $file,
                    [
                        'ID',
                        'Title',
                        'Body',
                        'Category',
                        'Status',
                        'Created At',
                    ]
                );

                foreach ($posts as $post) {
                    fputcsv(
                        $file,
                        [
                            $post->id,
                            $post->title,
                            $post->body,
                            $post->category?->name,
                            $post->status,
                            $post->created_at,
                        ]
                    );
                }

                fclose($file);
            },
            $filename,
            [
                'Content-Type' =>
                    'text/csv',
            ]
        );
    }

    /**
     * GET /api/posts-statistics
     *
     * Dashboard statistics.
     */
    public function statistics()
    {
        $totalPosts =
            Post::count();

        $todayPosts =
            Post::whereDate(
                'created_at',
                today()
            )->count();

        $weekPosts =
            Post::whereBetween(
                'created_at',
                [
                    now()->startOfWeek(),
                    now()->endOfWeek(),
                ]
            )->count();

        $monthPosts =
            Post::whereMonth(
                'created_at',
                now()->month
            )
            ->whereYear(
                'created_at',
                now()->year
            )
            ->count();

        $totalCategories =
            Category::count();

        $draftPosts =
            Post::where(
                'status',
                'draft'
            )->count();

        $publishedPosts =
            Post::where(
                'status',
                'published'
            )->count();

        $archivedPosts =
            Post::where(
                'status',
                'archived'
            )->count();

        $latestPost =
            Post::with('category')
                ->latest()
                ->first();

        $categoryStatistics =
            Category::withCount('posts')
                ->orderByDesc(
                    'posts_count'
                )
                ->get([
                    'id',
                    'name',
                ]);

        return response()->json([
            'data' => [
                'total_posts' =>
                    $totalPosts,

                'today_posts' =>
                    $todayPosts,

                'week_posts' =>
                    $weekPosts,

                'month_posts' =>
                    $monthPosts,

                'total_categories' =>
                    $totalCategories,

                'draft_posts' =>
                    $draftPosts,

                'published_posts' =>
                    $publishedPosts,

                'archived_posts' =>
                    $archivedPosts,

                'latest_post' =>
                    $latestPost,

                'category_statistics' =>
                    $categoryStatistics,
            ],
        ], 200);
    }
}