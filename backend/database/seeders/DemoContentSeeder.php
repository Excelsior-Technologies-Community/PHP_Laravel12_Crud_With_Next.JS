<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Comment;
use App\Models\ContactMessage;
use App\Models\Media;
use App\Models\NewsletterSubscriber;
use App\Models\Post;
use App\Models\PostReaction;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoContentSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $authors = collect([
                ['name' => 'Aarav Shah', 'email' => 'aarav@example.com'],
                ['name' => 'Mira Patel', 'email' => 'mira@example.com'],
                ['name' => 'Riya Mehta', 'email' => 'riya@example.com'],
            ])->mapWithKeys(fn (array $author) => [
                $author['email'] => User::updateOrCreate(
                    ['email' => $author['email']],
                    ['name' => $author['name'], 'password' => 'password']
                ),
            ]);

            $categories = collect([
                ['name' => 'Design', 'description' => 'Thoughtful visual systems and product craft.'],
                ['name' => 'Technology', 'description' => 'Practical ideas for building better digital products.'],
                ['name' => 'Culture', 'description' => 'People, places and ideas shaping modern work.'],
                ['name' => 'Business', 'description' => 'Clear thinking for sustainable teams and products.'],
            ])->mapWithKeys(fn (array $category) => [
                $category['name'] => Category::updateOrCreate(['name' => $category['name']], $category),
            ]);

            $tags = collect(['Design Systems', 'Laravel', 'Next.js', 'Leadership', 'Remote Work', 'Productivity', 'Accessibility', 'Strategy'])
                ->mapWithKeys(fn (string $name) => [
                    $name => Tag::updateOrCreate(['slug' => Str::slug($name)], ['name' => $name, 'slug' => Str::slug($name)]),
                ]);

            $posts = [
                [
                    'title' => 'Designing calm software for busy teams',
                    'category' => 'Design', 'author' => 'aarav@example.com', 'status' => 'published',
                    'tags' => ['Design Systems', 'Accessibility', 'Productivity'], 'views_count' => 248,
                    'image' => 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=85',
                    'body' => '<p>The best work tools reduce noise before they add power. A calm interface gives people clear priorities, sensible defaults and enough room to think.</p><p>Good design is not decoration around a workflow. It is the workflow made easier to understand.</p>',
                ],
                [
                    'title' => 'A practical Laravel and Next.js content stack',
                    'category' => 'Technology', 'author' => 'mira@example.com', 'status' => 'published',
                    'tags' => ['Laravel', 'Next.js', 'Strategy'], 'views_count' => 412,
                    'image' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=85',
                    'body' => '<p>Laravel gives the content model a durable home while Next.js makes the reading experience fast and flexible.</p><p>The useful boundary is simple: the API owns truth, and the frontend owns presentation.</p>',
                ],
                [
                    'title' => 'The quiet rituals behind excellent remote teams',
                    'category' => 'Culture', 'author' => 'riya@example.com', 'status' => 'published',
                    'tags' => ['Remote Work', 'Leadership', 'Culture'], 'views_count' => 176,
                    'image' => 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85',
                    'body' => '<p>Remote collaboration improves when teams make invisible work visible. A short written update can save an hour of meetings.</p><p>Trust grows from predictable communication, not constant availability.</p>',
                ],
                [
                    'title' => 'Small product bets that compound over time',
                    'category' => 'Business', 'author' => 'aarav@example.com', 'status' => 'draft',
                    'tags' => ['Strategy', 'Productivity'], 'views_count' => 39,
                    'image' => 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85',
                    'body' => '<p>Long-term product momentum often comes from a series of small, measurable improvements rather than one dramatic launch.</p>',
                ],
                [
                    'title' => 'Accessible by default: the checklist we use',
                    'category' => 'Design', 'author' => 'mira@example.com', 'status' => 'published',
                    'tags' => ['Accessibility', 'Design Systems'], 'views_count' => 301,
                    'image' => 'https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=85',
                    'body' => '<p>Accessibility is strongest when it is part of the first sketch, not a final inspection. Contrast, focus, keyboard flow and language all matter.</p>',
                ],
                [
                    'title' => 'Planning a publishing calendar that people can sustain',
                    'category' => 'Business', 'author' => 'riya@example.com', 'status' => 'draft',
                    'tags' => ['Strategy', 'Productivity'], 'views_count' => 24,
                    'image' => 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=85',
                    'body' => '<p>A useful editorial calendar leaves room for curiosity. It balances consistency with enough flexibility to follow the work where it leads.</p>',
                ],
            ];

            $createdPosts = collect();
            foreach ($posts as $data) {
                $slug = Str::slug($data['title']);
                $post = Post::withTrashed()->updateOrCreate(
                    ['slug' => $slug],
                    [
                        'title' => $data['title'], 'body' => $data['body'], 'category_id' => $categories[$data['category']]->id,
                        'author_id' => $authors[$data['author']]->id, 'status' => $data['status'], 'featured_image' => $data['image'],
                        'seo_title' => $data['title'] . ' | The Postroom', 'meta_description' => Str::limit(strip_tags($data['body']), 150),
                        'reading_time' => max(1, (int) ceil(str_word_count(strip_tags($data['body'])) / 200)),
                        'published_at' => $data['status'] === 'published' ? now()->subDays(rand(1, 18)) : null, 'views_count' => $data['views_count'],
                    ]
                );
                if ($post->trashed()) $post->restore();
                $post->tags()->sync($tags->only($data['tags'])->pluck('id'));
                $post->media()->updateOrCreate(['path' => $data['image']], ['name' => $data['title'] . ' cover', 'mime_type' => 'image/jpeg', 'is_featured' => true]);
                $createdPosts->push($post);
            }

            $createdPosts->each(function (Post $post) use ($createdPosts) {
                $related = $createdPosts->where('id', '!=', $post->id)->take(2)->pluck('id')->all();
                $post->relatedPosts()->sync($related);
            });

            $first = $createdPosts->first();
            if ($first) {
                Comment::updateOrCreate(['post_id' => $first->id, 'email' => 'reader@example.com'], ['name' => 'Neel Joshi', 'body' => 'This is a thoughtful and useful read.', 'status' => 'approved']);
                Comment::updateOrCreate(['post_id' => $first->id, 'email' => 'pending@example.com'], ['name' => 'Kavya Desai', 'body' => 'I would love to hear more about the process.', 'status' => 'pending']);
                PostReaction::updateOrCreate(['post_id' => $first->id, 'visitor_key' => 'demo-reader', 'type' => 'like']);
                PostReaction::updateOrCreate(['post_id' => $first->id, 'visitor_key' => 'demo-reader', 'type' => 'bookmark']);
            }

            NewsletterSubscriber::updateOrCreate(['email' => 'newsletter@example.com']);
            ContactMessage::updateOrCreate(['email' => 'client@example.com'], ['name' => 'Demo Client', 'subject' => 'A project enquiry', 'message' => 'I would like to discuss a content project.', 'is_read' => false]);
            ActivityLog::updateOrCreate(['action' => 'seeded_demo', 'subject_type' => 'demo', 'subject_id' => 1], ['description' => 'Demo editorial content was added for testing.']);
        });
    }
}
