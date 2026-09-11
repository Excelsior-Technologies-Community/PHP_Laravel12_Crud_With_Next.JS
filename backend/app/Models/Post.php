<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    /**
     * Fields allowed for mass assignment.
     */
    protected $fillable = [
        'title',
        'body',
        'category_id',
        'status',
    ];

    /**
     * A post belongs to one category.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}