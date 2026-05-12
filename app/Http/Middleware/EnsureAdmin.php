<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user('sanctum') instanceof Admin) {
            return response()->json([
                'success' => false,
                'message' => 'Akses admin diperlukan.',
            ], 403);
        }

        return $next($request);
    }
}
