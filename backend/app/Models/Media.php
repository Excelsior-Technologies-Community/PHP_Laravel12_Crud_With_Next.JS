<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    protected $fillable = ['post_id', 'name', 'path', 'mime_type', 'size', 'is_featured'];
    protected $casts = ['is_featured' => 'boolean'];

    public function post() { return $this->belongsTo(Post::class); }
}
