<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     * Param: role (admin | operator)
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (! $request->user()) {
             return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($role === 'admin' && ! $request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        
        // operator access allows both admins and operators
        if ($role === 'operator' && ! $request->user()->isOperator()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
