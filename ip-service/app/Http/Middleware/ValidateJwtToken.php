<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpFoundation\Response;

class ValidateJwtToken
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $payload = JWTAuth::parseToken()->getPayload();
            $userId = (int) $payload->get('sub');
            $userRole = (string) ($payload->get('role') ?? 'user');

            if ($userId <= 0) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            $request->attributes->set('auth_user_id', $userId);
            $request->attributes->set('auth_user_role', $userRole);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return $next($request);
    }
}
