<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\CategoryController;

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