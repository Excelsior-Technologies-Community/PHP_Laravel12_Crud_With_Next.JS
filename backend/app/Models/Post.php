<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Fields allowed for mass assignment.
     */
    protected $fillable = [
        'title',
        'slug',
        'body',
        'featured_image',
        'seo_title',
        'meta_description',
        'category_id',
        'author_id',
        'status',
        'reading_time',
        'published_at',
        'views_count',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    /**
     * A post belongs to one category.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class);
    }

    public function media()
    {
        return $this->hasMany(Media::class);
    }

    public function revisions()
    {
        return $this->hasMany(PostRevision::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function relatedPosts()
    {
        return $this->belongsToMany(self::class, 'related_posts', 'post_id', 'related_post_id');
    }
}