<?php

namespace App\Http\Middleware;

use App\Models\Officer;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOfficerRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $officer = $request->user('sanctum');

        if (! $officer instanceof Officer) {
            return response()->json([
                'success' => false,
                'message' => 'Akses petugas diperlukan.',
            ], 403);
        }

        if ($roles !== [] && ! in_array($officer->role, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Role petugas tidak memiliki akses.',
            ], 403);
        }

        return $next($request);
    }
}
