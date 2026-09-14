<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Comment;
use App\Models\Category;
use App\Models\ContactMessage;
use App\Models\Media;
use App\Models\NewsletterSubscriber;
use App\Models\Post;
use App\Models\PostReaction;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BlogController extends Controller
{
    private function postQuery()
    {
        return Post::with(['category', 'author:id,name,email', 'tags', 'media', 'relatedPosts:id,title,slug']);
    }

    private function payload(Request $request): array
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
            'author_id' => 'nullable|exists:users,id',
            'status' => 'required|in:draft,published,archived',
            'seo_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'published_at' => 'nullable|date',
            'tag_ids' => 'array',
            'tag_ids.*' => 'exists:tags,id',
            'related_post_ids' => 'array',
            'related_post_ids.*' => 'exists:posts,id',
        ]);
        $data['slug'] = Str::slug($data['title']);
        $data['reading_time'] = max(1, (int) ceil(str_word_count(strip_tags($data['body'])) / 200));
        if ($data['status'] === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }
        return $data;
    }

    public function posts(Request $request)
    {
        $query = $this->postQuery();
        if ($request->boolean('public')) $query->where('status', 'published')->where(function ($q) { $q->whereNull('published_at')->orWhere('published_at', '<=', now()); });
        if ($request->filled('search')) $query->where(fn ($q) => $q->where('title', 'like', "%{$request->search}%")->orWhere('body', 'like', "%{$request->search}%"));
        if ($request->filled('category_id')) $query->where('category_id', $request->category_id);
        if ($request->filled('category')) $query->whereHas('category', fn ($q) => $q->where('name', $request->category)->orWhere('slug', $request->category));
        if ($request->filled('tag')) $query->whereHas('tags', fn ($q) => $q->where('slug', $request->tag));
        if ($request->filled('status')) $query->where('status', $request->status);
        $posts = $query->latest()->paginate((int) $request->get('per_page', 10));
        return response()->json(['data' => $posts->items(), 'pagination' => ['current_page' => $posts->currentPage(), 'last_page' => $posts->lastPage(), 'total' => $posts->total()]]);
    }

    public function store(Request $request)
    {
        $data = $this->payload($request);
        $tagIds = $data['tag_ids'] ?? [];
        $relatedIds = $data['related_post_ids'] ?? [];
        unset($data['tag_ids'], $data['related_post_ids']);
        $post = Post::create($data);
        $post->tags()->sync($tagIds);
        $post->relatedPosts()->sync($relatedIds);
        ActivityLog::create(['action' => 'created', 'subject_type' => 'post', 'subject_id' => $post->id, 'description' => "Created post {$post->title}"]);
        return response()->json(['data' => $post->fresh()->load(['category', 'tags', 'author', 'media', 'relatedPosts'])], 201);
    }

    public function show(string $slug)
    {
        $post = $this->postQuery()->where('slug', $slug)->firstOrFail();
        if ($post->status === 'published') $post->increment('views_count');
        return response()->json(['data' => $post->fresh()->load(['category', 'tags', 'author', 'media', 'relatedPosts', 'comments' => fn ($q) => $q->where('status', 'approved')->latest()])]);
    }

    public function update(Request $request, Post $post)
    {
        $data = $this->payload($request);
        $tagIds = $data['tag_ids'] ?? $post->tags->pluck('id')->all();
        $relatedIds = $data['related_post_ids'] ?? $post->relatedPosts->pluck('id')->all();
        unset($data['tag_ids'], $data['related_post_ids']);
        $post->revisions()->create(['title' => $post->title, 'body' => $post->body, 'snapshot' => $post->toArray()]);
        $post->update($data);
        $post->tags()->sync($tagIds);
        $post->relatedPosts()->sync(array_diff($relatedIds, [$post->id]));
        ActivityLog::create(['action' => 'updated', 'subject_type' => 'post', 'subject_id' => $post->id, 'description' => "Updated post {$post->title}"]);
        return response()->json(['data' => $post->fresh()->load(['category', 'tags', 'author', 'media', 'relatedPosts'])]);
    }

    public function autosave(Request $request, Post $post)
    {
        $data = $request->validate(['title' => 'required|string|max:255', 'body' => 'required|string']);
        $data['reading_time'] = max(1, (int) ceil(str_word_count(strip_tags($data['body'])) / 200));
        $post->update($data);
        return response()->json(['message' => 'Draft autosaved', 'saved_at' => now()->toIso8601String()]);
    }

    public function trash()
    {
        return response()->json(['data' => Post::onlyTrashed()->with('category')->latest('deleted_at')->get()]);
    }

    public function restore(int $id)
    {
        $post = Post::onlyTrashed()->findOrFail($id);
        $post->restore();
        return response()->json(['message' => 'Post restored']);
    }

    public function bulkStatus(Request $request)
    {
        $data = $request->validate(['ids' => 'required|array', 'status' => 'required|in:draft,published,archived']);
        Post::whereIn('id', $data['ids'])->update(['status' => $data['status'], 'published_at' => $data['status'] === 'published' ? now() : null]);
        return response()->json(['message' => 'Statuses updated']);
    }

    public function upload(Request $request, Post $post)
    {
        $request->validate(['files' => 'required|array', 'files.*' => 'image|max:5120']);
        foreach ($request->file('files') as $file) {
            $path = $file->store('media', 'public');
            Media::create(['post_id' => $post->id, 'name' => $file->getClientOriginalName(), 'path' => Storage::url($path), 'mime_type' => $file->getMimeType(), 'size' => $file->getSize(), 'is_featured' => $request->boolean('featured')]);
        }
        return response()->json(['data' => $post->fresh()->load('media')]);
    }

    public function tags()
    {
        return response()->json(['data' => Tag::withCount('posts')->orderBy('name')->get()]);
    }

    public function authors()
    {
        return response()->json(['data' => User::query()->orderBy('name')->get(['id', 'name', 'email'])]);
    }

    public function saveTag(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:80']);
        $tag = Tag::firstOrCreate(['slug' => Str::slug($data['name'])], ['name' => $data['name']]);
        return response()->json(['data' => $tag], 201);
    }

    public function dashboard(Request $request)
    {
        $from = $request->date_from ? now()->parse($request->date_from)->startOfDay() : now()->subDays(30)->startOfDay();
        $to = $request->date_to ? now()->parse($request->date_to)->endOfDay() : now()->endOfDay();
        $base = Post::withTrashed()->whereBetween('created_at', [$from, $to]);
        return response()->json(['data' => [
            'total_posts' => (clone $base)->count(), 'published_posts' => (clone $base)->where('status', 'published')->count(), 'draft_posts' => (clone $base)->where('status', 'draft')->count(),
            'archived_posts' => (clone $base)->where('status', 'archived')->count(), 'total_views' => (clone $base)->sum('views_count'),
            'category_chart' => Category::withCount(['posts' => fn ($q) => $q->whereBetween('posts.created_at', [$from, $to])])->get(['id', 'name']),
            'monthly_chart' => Post::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, count(*) as total")->whereBetween('created_at', [$from, $to])->groupBy('month')->orderBy('month')->get(),
            'recent_posts' => Post::latest()->limit(8)->get(['id', 'title', 'slug', 'status', 'views_count', 'created_at']), 'most_viewed' => Post::orderByDesc('views_count')->limit(8)->get(['id', 'title', 'slug', 'views_count']),
            'activity' => ActivityLog::latest()->limit(12)->get(),
        ]]);
    }

    public function export(Request $request): StreamedResponse
    {
        $format = $request->get('format', 'csv');
        $posts = Post::with('category')->latest()->get();
        $content = $format === 'pdf' ? '<html><body><h1>Posts export</h1><table border="1"><tr><th>Title</th><th>Status</th></tr>' . $posts->map(fn ($p) => "<tr><td>{$p->title}</td><td>{$p->status}</td></tr>")->implode('') . '</table></body></html>' : "Title,Status,Category,Views\n" . $posts->map(fn ($p) => '"' . str_replace('"', '""', $p->title) . '",' . $p->status . ',"' . ($p->category->name ?? '') . ',' . $p->views_count)->implode("\n");
        return response()->streamDownload(fn () => print($content), 'posts.' . ($format === 'pdf' ? 'html' : 'csv'), ['Content-Type' => $format === 'pdf' ? 'text/html' : 'text/csv']);
    }

    public function revisions(Post $post) { return response()->json(['data' => $post->revisions()->latest()->get()]); }

    public function comments(Request $request, Post $post)
    {
        $data = $request->validate(['name' => 'required|string|max:100', 'email' => 'required|email', 'body' => 'required|string']);
        return response()->json(['data' => $post->comments()->create($data + ['status' => 'pending'])], 201);
    }

    public function moderateComment(Request $request, Comment $comment)
    {
        $comment->update($request->validate(['status' => 'required|in:pending,approved,rejected']));
        return response()->json(['data' => $comment]);
    }

    public function react(Request $request, Post $post)
    {
        $data = $request->validate(['type' => 'required|in:like,bookmark', 'visitor_key' => 'required|string|max:100']);
        $reaction = PostReaction::where($data)->first();
        $reaction ? $reaction->delete() : PostReaction::create($data + ['post_id' => $post->id]);
        return response()->json(['count' => PostReaction::where('post_id', $post->id)->where('type', $data['type'])->count()]);
    }

    public function subscribe(Request $request) { return response()->json(['data' => NewsletterSubscriber::firstOrCreate($request->validate(['email' => 'required|email']), $request->only('email'))], 201); }

    public function contact(Request $request) { return response()->json(['data' => ContactMessage::create($request->validate(['name' => 'required|string', 'email' => 'required|email', 'subject' => 'nullable|string', 'message' => 'required|string']))], 201); }

    public function sitemap()
    {
        $urls = Post::where('status', 'published')->get(['slug', 'updated_at'])->map(fn ($p) => '<url><loc>' . url('/blog/' . $p->slug) . '</loc><lastmod>' . $p->updated_at->toAtomString() . '</lastmod></url>')->implode('');
        return response('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . $urls . '</urlset>', 200, ['Content-Type' => 'application/xml']);
    }
}
