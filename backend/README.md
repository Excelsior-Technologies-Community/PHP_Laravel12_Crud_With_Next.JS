## PART 1 – BACKEND (Laravel API)

---

### 1.1 Laravel Installation

```bash
composer create-project laravel/laravel backend

```

---

### 1.2 Database Setup

Create database (MySQL):

```sql
CREATE DATABASE backend;
```

Edit `.env` file:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=backend
DB_USERNAME=root
DB_PASSWORD=
```

---

### 1.3 Create Post Model + Migration

```bash
php artisan make:model Post -m
```

**Migration (database/migrations/create_posts_table.php)**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();              // Primary key
            $table->string('title');   // Post title
            $table->text('body');      // Post content
            $table->timestamps();      // created_at & updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
```

Run migration:

```bash
php artisan migrate
```

---

### 1.4 Post Model
`app/Models/Post.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'body'];
}
```

---

### 1.5 Create API Controller

```bash
php artisan make:controller Api/PostController
```

`app/Http/Controllers/Api/PostController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    // GET /api/posts
    public function index()
    {
        return response()->json([
            'data' => Post::all()
        ], 200);
    }

    // POST /api/posts
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'body'  => 'required|string',
        ]);

        $post = Post::create([
            'title' => $request->title,
            'body'  => $request->body,
        ]);

        return response()->json([
            'message' => 'Post created successfully',
            'data' => $post
        ], 201);
    }

    // GET /api/posts/{id}
    public function show($id)
    {
        $post = Post::findOrFail($id);

        return response()->json([
            'data' => $post
        ], 200);
    }

    // PUT /api/posts/{id}
    public function update(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'body'  => 'required|string',
        ]);

        $post = Post::findOrFail($id);
        $post->update($request->all());

        return response()->json([
            'message' => 'Post updated successfully',
            'data' => $post
        ], 200);
    }

    // DELETE /api/posts/{id}
    public function destroy($id)
    {
        Post::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Post deleted successfully'
        ], 200);
    }
}
```

---

### 1.6 API Routes
`routes/api.php`

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PostController;

Route::apiResource('posts', PostController::class);
```

---

### 1.7 CORS Configuration
`config/cors.php`

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:3000'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

Backend Done ✔️

Test API:

```http
GET http://127.0.0.1:8000/api/posts
```
<img width="1794" height="882" alt="Screenshot 2025-12-30 132849" src="https://github.com/user-attachments/assets/6371c9dc-d675-4ff0-a5f9-ac8cb46e43d5" />

---
