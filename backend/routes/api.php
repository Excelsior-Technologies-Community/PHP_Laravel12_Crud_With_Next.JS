<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BlogController;

/*
|--------------------------------------------------------------------------
| Post APIs
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
| These custom routes must come BEFORE apiResource().
|--------------------------------------------------------------------------
*/

Route::get(
    'posts/statistics',
    [PostController::class, 'statistics']
);

Route::get(
    'posts/export',
    [PostController::class, 'export']
);

Route::post(
    'posts/bulk-delete',
    [PostController::class, 'bulkDelete']
);

Route::post(
    'posts/{id}/duplicate',
    [PostController::class, 'duplicate']
);

Route::patch(
    'posts/{id}/status',
    [PostController::class, 'updateStatus']
);

Route::apiResource(
    'posts',
    PostController::class
);

/*
|--------------------------------------------------------------------------
| Category APIs
|--------------------------------------------------------------------------
*/

Route::apiResource(
    'categories',
    CategoryController::class
)->only([
    'index',
    'store',
    'update',
    'destroy',
]);

/* Requested blog CMS and public website APIs. */
Route::get('content/posts', [BlogController::class, 'posts']);
Route::post('content/posts', [BlogController::class, 'store']);
Route::get('content/posts/{slug}', [BlogController::class, 'show']);
Route::put('content/posts/{post}', [BlogController::class, 'update']);
Route::patch('content/posts/{post}/autosave', [BlogController::class, 'autosave']);
Route::post('content/posts/{post}/media', [BlogController::class, 'upload']);
Route::get('content/posts/{post}/revisions', [BlogController::class, 'revisions']);
Route::get('content/trash', [BlogController::class, 'trash']);
Route::patch('content/trash/{id}/restore', [BlogController::class, 'restore']);
Route::post('content/posts/bulk-status', [BlogController::class, 'bulkStatus']);
Route::get('content/tags', [BlogController::class, 'tags']);
Route::post('content/tags', [BlogController::class, 'saveTag']);
Route::get('content/authors', [BlogController::class, 'authors']);
Route::get('content/dashboard', [BlogController::class, 'dashboard']);
Route::get('content/export', [BlogController::class, 'export']);

Route::get('public/posts', fn (\Illuminate\Http\Request $request) => app(BlogController::class)->posts($request->merge(['public' => true])));
Route::get('public/posts/{slug}', [BlogController::class, 'show']);
Route::post('public/posts/{post}/comments', [BlogController::class, 'comments']);
Route::patch('public/comments/{comment}', [BlogController::class, 'moderateComment']);
Route::post('public/posts/{post}/react', [BlogController::class, 'react']);
Route::post('public/newsletter', [BlogController::class, 'subscribe']);
Route::post('public/contact', [BlogController::class, 'contact']);
Route::get('public/sitemap.xml', [BlogController::class, 'sitemap']);