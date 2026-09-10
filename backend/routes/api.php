<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\CategoryController;

/*
|--------------------------------------------------------------------------
| Post APIs
|--------------------------------------------------------------------------
*/

Route::get(
    'posts/statistics',
    [PostController::class, 'statistics']
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